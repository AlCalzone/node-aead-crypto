const { spawn } = require("child_process");
const path = require("path");
const os = require("os");

const isWindows = /^win/.test(os.platform());
const isLinux = os.platform() === "linux";
const isDarwin = os.platform() === "darwin";
const isARM = isLinux && process.env.ARCH === "arm"; // This is one part of the build matrix

// Take the newest version for each ABI version
const getRuntimeVersions = (runtime) => {
	// source: https://nodejs.org/en/download/releases/
	return runtime === "node" ? ["6.14.4", "8.13.0"]
		// source: https://github.com/lgeiger/electron-abi
		: /* runtime === "electron" */["1.2.8", "1.3.13", "1.4.16", "1.7.10", "2.0.0", "3.0.0"]
		;
}

const getArchs = () => {
	return (isWindows || isLinux) ? ["ia32", "x64"]
		: isARM ? ["arm"]
			: isDarwin ? ["x64"]
				: [];
};
const getRuntimes = (arch) => arch === "arm" ? ["node"] : ["node", "electron"];

function getAllVersions() {
	const ret = [];
	for (const arch of getArchs()) {
		for (const runtime of getRuntimes(arch)) {
			for (const target of getRuntimeVersions(runtime)) {
				ret.push({
					arch, runtime, target,
				});
			}
		}
	}
	return ret;
}

const token = process.env.PREBUILD_TOKEN;

async function main() {
	const executable = path.join(__dirname, "..", "node_modules/.bin", "prebuild" + (isWindows ? ".cmd" : ""));
	for (const version of getAllVersions()) {
		console.log();
		console.log(`prebuilding binaries for ${version.runtime}@${version.target} (${version.arch})...`);
		if (version.arch === "arm") {
			await runCommand("node-gyp", ["configure", "--target_arch=arm"], {
				cwd: path.join(__dirname, ".."),
				stdio: ["ignore", "ignore", "ignore"]
			});
		}
		const { exitCode } = await runCommand(
			executable,
			[
				"-r", version.runtime,
				"-t", version.target,
				"-u", token,
				"--arch", version.arch
			],
			{
				cwd: path.join(__dirname, ".."),
				stdio: ["ignore", "ignore", "ignore"]
			}
		)
		if (exitCode !== 0) {
			console.error(`WARN: prebuild failed for ${version.runtime}@${version.target} (${version.arch})!`)
			// throw new Error(`prebuild exited with code ${exitCode}`);
		}
	}
	process.exit(0);
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
