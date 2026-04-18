const mockPush = jest.fn();
const mockRouter = { push: mockPush, replace: jest.fn(), prefetch: jest.fn() };
const useRouter = jest.fn(() => mockRouter);
const usePathname = jest.fn(() => "/");
const useSearchParams = jest.fn(() => new URLSearchParams());
const useParams = jest.fn(() => ({}));

module.exports = { useRouter, usePathname, useSearchParams, useParams };
