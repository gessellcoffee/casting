import LoginPageClient from "./LoginPageClient";

interface LoginPageProps {
  searchParams?: {
    redirect?: string;
  };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const redirectParam = searchParams?.redirect;
  const redirectTo = redirectParam && redirectParam.startsWith("/") ? redirectParam : "/";

  return <LoginPageClient redirectTo={redirectTo} />;
}
