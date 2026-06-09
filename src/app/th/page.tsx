import { ThDashboard } from "@/components/th/ThDashboard";
import { getThEmpleados, getThPredicciones, getThParticipacion } from "@/lib/th";

export const dynamic = "force-dynamic";

export default async function ThPage() {
  const [empleados, predicciones, participacion] = await Promise.all([
    getThEmpleados(),
    getThPredicciones(),
    getThParticipacion(),
  ]);

  return (
    <ThDashboard
      empleados={empleados}
      predicciones={predicciones}
      participacion={participacion}
    />
  );
}
