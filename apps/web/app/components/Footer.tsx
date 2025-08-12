export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-700 bg-black/40 mt-12">
      <div className="max-w-screen-2xl mx-auto px-4 py-8 text-sm text-gray-400 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p>© {year} Job Matcher</p>
        <nav className="flex flex-wrap gap-4">
          <a
            href="https://github.com/leonfoeck/job-matcher"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white"
          >
            GitHub
          </a>
          <a href="mailto:hello@example.com" className="hover:text-white">
            Contact
          </a>
          <a href="#top" className="hover:text-white">Back to top</a>
        </nav>
      </div>
    </footer>
  );
}
