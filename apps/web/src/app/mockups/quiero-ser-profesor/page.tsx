import { PageTitle } from "../_components/ui";
import TeacherWizardMockup from "./wizard";

export const metadata = { title: "Quiero ser profesor" };

export default function QuieroSerProfesorMockupPage() {
  return (
    <>
      <PageTitle
        title="Quiero ser profesor"
        description="Completá tu solicitud en 4 pasos. Podés guardarla y seguir después."
      />
      <TeacherWizardMockup />
    </>
  );
}
