"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

export function DeliveryAnimation({ className }: { className?: string }) {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    fetch("/delivery-animation.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Erro ao carregar animação:", err));
  }, []);

  if (!animationData) {
    return <div className={className} />;
  }

  return (
    <Lottie 
      animationData={animationData} 
      loop={true}
      className={className}
    />
  );
}
