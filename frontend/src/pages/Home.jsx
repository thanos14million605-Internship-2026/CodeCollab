import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Code,
  Users,
  Video,
  MessageSquare,
  Share2,
  Zap,
  ArrowRight,
  CheckCircle,
  Star,
  BookOpen,
  Monitor,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

const Home = () => {
  const { isAuthenticated, user } = useAuthStore();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="text-center"
          >
            <motion.div variants={itemVariants} className="mb-6">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                <Star className="w-4 h-4 mr-2" />
                The Future of Online Coding Education
              </div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6"
            >
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CodeCollab
              </span>
              <br />
              Learn Together,
              <br />
              Code Together
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto"
            >
              Transform your coding classes with real-time collaboration, video
              calls, and interactive learning tools designed for modern
              education.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="group btn-primary text-lg px-8 py-4 flex items-center"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="group btn-primary text-lg px-8 py-4 flex items-center"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link to="/signin" className="btn-outline text-lg px-8 py-4">
                    Sign In
                  </Link>
                </>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
