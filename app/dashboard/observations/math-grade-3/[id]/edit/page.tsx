"use client";

import { useParams } from "next/navigation";
import Grade123ObservationFormV2 from "@/components/observations/Grade123ObservationFormV2";

export default function EditMathGrade3Page() {
  const params = useParams();
  const observationId = params?.id as string;
  
  return (
    <Grade123ObservationFormV2 
      subject="MATH" 
      grade="3" 
      observationId={observationId}
      mode="edit"
    />
  );
}