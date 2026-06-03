import { LoginForm } from "../features/auth/LoginForm";

export function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 via-purple-600 to-pink-500 p-4">
      <LoginForm />
    </div>
  );
}
