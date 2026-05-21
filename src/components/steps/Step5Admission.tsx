import { GenericDocumentStep } from "./GenericDocumentStep";

export function Step5Admission() {
  return (
    <GenericDocumentStep
      step={5}
      title="Lettres d'admission & reçus de paiement"
      slots={[
        { type: "admission_letter", label: "Lettre d'admission officielle", mandatory: true },
        { type: "payment_receipt", label: "Reçu de paiement (frais de dossier)", mandatory: true },
        { type: "deposit_receipt", label: "Reçu d'acompte", mandatory: false },
      ]}
    />
  );
}
