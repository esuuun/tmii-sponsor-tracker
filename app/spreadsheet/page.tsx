export default function SpreadsheetPage() {
  const spreadsheetUrl =
    "https://docs.google.com/spreadsheets/d/1-XUxACw3BJjK0fOYcZJp4kS5Acf0OZC037d3iA2gnSU/edit?usp=sharing";

  // Convert /edit URL to /htmlview or keep as-is for embedded editing
  const embedUrl = spreadsheetUrl.replace(
    "/edit?usp=sharing",
    "/edit?usp=sharing&embedded=true",
  );

  return (
    <div className="flex h-screen flex-col">
      {/* <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Excel / Analysis Spreadsheet</h1>
          <p className="mt-1 text-sm text-gray-500">
            Edit the sponsorship analysis spreadsheet directly below.
          </p>
        </div>
      </div> */}

      <div className="flex-1 overflow-hidden border border-gray-200 shadow-sm">
        {/* <a
          href={spreadsheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Open in Google Sheets ↗
        </a> */}
        <iframe
          src={embedUrl}
          className="h-full w-full"
          style={{ minHeight: "calc(100vh - 200px)" }}
          frameBorder="0"
          allowFullScreen
        />
      </div>
    </div>
  );
}
