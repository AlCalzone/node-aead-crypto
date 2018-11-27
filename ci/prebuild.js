const { spawn } = require("child_process");
const path = require("path");
const os = require("os");

const isWindows = /^win/.test(os.platform());

const versions = [
	{ runtime: "node", target: 48, arch: "x64" },
	{ runtime: "node", target: 48, arch: "x64" },
	{ runtime: "node", target: 48, arch: "x64" },
	{ runtime: "node", target: 57, arch: "x64" },
	{ runtime: "node", target: 57, arch: "x64" },
	{ runtime: "node", target: 57, arch: "x64" },
	{ runtime: "electron", target: 48, arch: "x64" },
	{ runtime: "electron", target: 48, arch: "x64" },
	{ runtime: "electron", target: 48, arch: "x64" },
	{ runtime: "electron", target: 57, arch: "x64" },
	{ runtime: "electron", target: 57, arch: "x64" },
	{ runtime: "electron", target: 57, arch: "x64" },
];
if (isWindows) {
	versions.push(
		{ runtime: "node", target: 48, arch: "x86" },
		{ runtime: "node", target: 48, arch: "x86" },
		{ runtime: "node", target: 48, arch: "x86" },
		{ runtime: "node", target: 57, arch: "x86" },
		{ runtime: "node", target: 57, arch: "x86" },
		{ runtime: "node", target: 57, arch: "x86" },
		{ runtime: "electron", target: 48, arch: "x86" },
		{ runtime: "electron", target: 48, arch: "x86" },
		{ runtime: "electron", target: 48, arch: "x86" },
		{ runtime: "electron", target: 57, arch: "x86" },
		{ runtime: "electron", target: 57, arch: "x86" },
		{ runtime: "electron", target: 57, arch: "x86" },
	);
}
if (os.platform() === "linux") {
	versions.push(
		{ runtime: "node", target: 48, arch: "arm" },
		{ runtime: "node", target: 48, arch: "arm" },
		{ runtime: "node", target: 48, arch: "arm" },
		{ runtime: "node", target: 57, arch: "arm" },
		{ runtime: "node", target: 57, arch: "arm" },
		{ runtime: "node", target: 57, arch: "arm" },
	);
}

const token = process.env.PREBUILD_TOKEN;

async function main() {
	const executable = path.join(__dirname, "..", "node_modules/.bin", "prebuild" + (isWindows ? ".cmd" : ""));
	for (const version of versions) {
		const { exitCode } = await runCommand(
			executable,
			[
				"-r", version.runtime,
				"-t", version.target,
				"-u", token,
				"--arch", version.arch
			],
			{ cwd: path.join(__dirname, "..") }
		)
		if (exitCode !== 0) {
			throw new Error(`prebuild exited with code ${exitCode}`);
		}
	}
}
main();

function runCommand(command, args, options) {
	if (typeof args === 'object' && !Array.isArray(args)) {
		// no args were given
		options = args;
		args = undefined;
	}
	if (options == null) options = {};
	if (args == null) args = [];

	/** @type {import("child_process").SpawnOptions} */
	const spawnOptions = {
		stdio: [
			options.stdin || process.stdin,
			options.stdout || process.stdout,
			options.stderr || process.stderr,
		]
	};

	// Now execute the npm process and avoid throwing errors
	return new Promise((resolve) => {
		try {
			const cmd = spawn(command, [].concat(args), spawnOptions)
				.on("close", (code, signal) => {
					resolve({
						exitCode: code,
						signal,
					});
				});
		} catch (e) {
			// doesn't matter, we return the exit code in the "close" handler
		}
	});
}
