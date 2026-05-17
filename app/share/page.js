import { Suspense } from "react";
import ShareClient from "./ShareClient";

export default function SharePage() {
  return (
    <Suspense
      fallback={(
        <div className="page-loading" role="status">
          <div className="loading-spinner" />
          <p>Loading share options...</p>
        </div>
      )}
    >
      <ShareClient />
    </Suspense>
  );
}
