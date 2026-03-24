import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useSubmittedWorkStore } from "./../store/submittedWorkStore";

const SubmittedWorkPage = () => {
  const { submissions, isLoading, fetchAllSubmissions } =
    useSubmittedWorkStore();

  useEffect(() => {
    fetchAllSubmissions();
  }, [fetchAllSubmissions]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6">Submitted Work</h1>

      {isLoading ? (
        <p>Loading...</p>
      ) : submissions.length === 0 ? (
        <p>No submitted work yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map((work) => (
            <motion.div
              key={work.id}
              whileHover={{ scale: 1.02 }}
              className="card p-4 bg-white shadow rounded-lg"
            >
              <h3 className="font-semibold text-gray-900 mb-2">
                Room: {work.room_name} ({work.room_code})
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                Student: {work.student_name} ({work.student_email})
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Language: {work.language}
              </p>
              <a
                href={work.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                <ExternalLink className="w-4 h-4" /> View PDF
              </a>
              <p className="text-xs text-gray-400 mt-2">
                Submitted on: {new Date(work.created_at).toLocaleString()}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubmittedWorkPage;
