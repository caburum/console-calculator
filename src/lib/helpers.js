/**
 * Downloads a string as a text file in the browser
 * @param {string} content - The string content to download
 * @param {string} filename - The name of the file to download (without extension)
 * @param {string} [extension='txt'] - The file extension (defaults to 'txt')
 * @param {string} [mimeType='text/plain'] - The MIME type for the file
 * @returns {boolean} - Returns true if download was triggered successfully
 * @throws {Error} - Throws if required parameters are missing or invalid
 */
export function downloadAsFile(content, filename, extension = 'txt', mimeType = 'text/plain') {
	// Validate required parameters
	if (!content || typeof content !== 'string') {
		throw new Error('Content is required and must be a string');
	}
	if (!filename || typeof filename !== 'string') {
		throw new Error('Filename is required and must be a string');
	}

	try {
		// Create blob from the content
		const blob = new Blob([content], { type: mimeType });

		// Create object URL
		const url = window.URL.createObjectURL(blob);

		// Create temporary link element
		const link = document.createElement('a');
		link.href = url;
		link.download = `${filename}.${extension}`;

		// Append link to body (required for Firefox)
		document.body.appendChild(link);

		// Trigger download
		link.click();

		// Clean up
		document.body.removeChild(link);
		window.URL.revokeObjectURL(url);

		return true;
	} catch (error) {
		console.error('Error downloading file:', error);
		throw error;
	}
}

export function loadFileAsText() {
	return new Promise((resolve, reject) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.txt';

		input.addEventListener('change', () => {
			const file = input.files[0];
			const reader = new FileReader();

			reader.addEventListener('load', () => {
				resolve(reader.result);
			});

			reader.addEventListener('error', () => {
				reject(new Error('Error reading file'));
			});

			reader.readAsText(file);
		});

		input.click();
	});
}
