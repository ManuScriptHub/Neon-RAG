
import Navbar from "@/components/Navbar";
import AuthForm from "@/components/AuthForm";

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <AuthForm isLogin={true} />
    </div>
  );
};

export default Login;
