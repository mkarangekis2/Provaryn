import { DocumentAnalysisReview } from "@/features/evidence/document-analysis-review";

export default async function VaultAnalysisPage({
  searchParams
}: {
  searchParams: Promise<{ documentId?: string }>;
}) {
  const resolved = await searchParams;
  return <DocumentAnalysisReview initialDocumentId={resolved.documentId} />;
}
