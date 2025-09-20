import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center p-8">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-400 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            페이지를 찾을 수 없습니다
          </h2>
          <p className="text-gray-500 mb-8">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to={`/`}
            className="inline-block w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-block w-full px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            이전 페이지로
          </button>
        </div>
      </div>
    </div>
  );
}
