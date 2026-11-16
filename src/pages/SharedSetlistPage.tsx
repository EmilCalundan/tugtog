import { useParams } from "react-router";
import { SharedSetlist } from "../components/SharedSetlist";

export function SharedSetlistPage() {
  const { shareId = "" } = useParams();
  return <SharedSetlist shareId={shareId} />;
}
