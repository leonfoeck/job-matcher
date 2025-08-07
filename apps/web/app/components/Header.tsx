
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
    const path = usePathname();
    const link = (href: string, label: string) => (
        <Link
            href={href}
            className={`px-2 py-1 rounded hover:underline ${path === href ? "underline" : ""}`}
        >
            {label}
        </Link>
    );

    return (
        <header className="border-b border-gray-700 sticky top-0 z-10 bg-black/40 backdrop-blur">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                <Link href="/" className="font-bold text-lg">Job Matcher</Link>
                <nav className="space-x-3 text-sm">
                    {link("/", "Jobs")}
                    {link("/profile", "Profile")}
                </nav>
            </div>
        </header>
    );
}
