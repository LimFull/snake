/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // 정적 HTML 내보내기 설정
  images: {
    unoptimized: true,  // GitHub Pages 배포를 위해 이미지 최적화 비활성화
  },
  basePath: '/snake',  // GitHub Pages의 레포지토리 이름과 일치하도록 설정
}

module.exports = nextConfig 