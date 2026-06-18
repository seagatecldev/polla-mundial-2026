-- ============================================================================
-- Seguridad: impedir que un jugador edite su propio puntaje en `profiles`
-- ----------------------------------------------------------------------------
-- Problema:
--   La tabla public.profiles guarda los puntos del ranking
--   (total_points, exact_scores, correct_results, predictions_count) en la
--   misma fila del usuario. La politica RLS `profiles_update_own` solo valida
--   auth.uid() = id, y los roles anon/authenticated tenian UPDATE a nivel de
--   TABLA (todas las columnas). Por eso un jugador logueado podia, desde la
--   consola del navegador, auto-asignarse puntos:
--       update profiles set total_points = 9999 where id = '<su id>';
--
-- Solucion:
--   Quitar el UPDATE de tabla y reotorgar UPDATE SOLO en columnas inofensivas
--   (display_name, avatar_url). Tambien revocar INSERT (el perfil lo crea el
--   trigger handle_new_user, que es SECURITY DEFINER y no depende de este
--   permiso). El recalculo de puntos (set_match_result, set_knockout_result,
--   _recalc_profiles) tambien es SECURITY DEFINER, asi que sigue funcionando.
--
--   IMPORTANTE: revocar columnas sueltas NO basta cuando el permiso es a nivel
--   de tabla; hay que revocar el de tabla y reotorgar solo las columnas seguras.
--
-- No toca ninguna fila de datos; es solo permisos y es 100% reversible.
-- Aplicar en cada proyecto: Seagate, Aquaspot, demo (y futuros clientes).
-- ============================================================================

-- === APLICAR ===============================================================
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT  UPDATE (display_name, avatar_url) ON public.profiles TO anon, authenticated;
REVOKE INSERT ON public.profiles FROM anon, authenticated;


-- === VERIFICAR =============================================================
-- Debe devolver UPDATE con columnas = "avatar_url, display_name" y sin INSERT.
select grantee, privilege_type,
       string_agg(column_name, ', ' order by column_name) as columnas
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'profiles'
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('UPDATE', 'INSERT')
group by grantee, privilege_type
order by grantee, privilege_type;


-- === AUDITORIA DE TRAMPA ===================================================
-- Compara el puntaje guardado contra la suma real de las predicciones.
-- Si todo esta limpio devuelve 0 filas; cualquier fila = puntaje que no cuadra
-- (posible manipulacion o recalculo pendiente).
with calc as (
  select user_id, coalesce(sum(points_earned), 0) as pts_reales
  from predictions
  group by user_id
)
select p.display_name,
       p.total_points              as pts_guardado,
       coalesce(c.pts_reales, 0)   as pts_reales,
       p.total_points - coalesce(c.pts_reales, 0) as diferencia
from profiles p
left join calc c on c.user_id = p.id
where p.total_points <> coalesce(c.pts_reales, 0)
order by diferencia desc;


-- === DESHACER (solo si fuese necesario revertir) ===========================
-- GRANT UPDATE, INSERT ON public.profiles TO anon, authenticated;
