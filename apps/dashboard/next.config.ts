import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["@insureinvestorsv2/db", "@insureinvestorsv2/lib"],
};

export default nextConfig;
