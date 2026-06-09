const isGithubPages = process.env.GITHUB_PAGES === 'true';
const githubPagesBasePath = '/hw-accident-brf';
const basePath = isGithubPages ? githubPagesBasePath : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: false,
  output: isGithubPages ? 'export' : undefined,
  basePath,
  assetPrefix: isGithubPages ? `${githubPagesBasePath}/` : undefined,
  trailingSlash: isGithubPages,
  images: {
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath
  }
};

export default nextConfig;
