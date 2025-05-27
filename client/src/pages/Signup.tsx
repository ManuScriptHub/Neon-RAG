
import Navbar from "@/components/Navbar";
import AuthForm from "@/components/AuthForm";

const Signup = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <AuthForm isLogin={false} />
    </div>
  );
};

export default Signup;
