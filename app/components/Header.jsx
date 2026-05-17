"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const isShare = pathname === "/share";

  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="VaultDrop home">
        <div className="brand-icon" aria-hidden="true">
          <Lock size={16} />
        </div>
        <span className="brand-name">VaultDrop</span>
      </Link>

      <nav className="header-nav" aria-label="Main navigation">
        <Link href="/access" className="nav-link">
          Receive File
        </Link>
        {!isShare && (
          <Link href="/share" className="btn-primary header-cta">
            + New Drop
          </Link>
        )}
      </nav>
    </header>
  );
}
