import React from 'react';

export default function About() {
  return (
    <div className="max-w-2xl mx-auto bg-neutral-surface border border-neutral-border rounded-[12px] p-6 shadow">
      <h2 className="text-3xl font-semibold mb-4">About CourseScheduler</h2>
      <div className="animate-fade-in bg-gradient-to-br from-indigo-500 to-purple-700 text-white text-center rounded-lg py-10 mb-8">
        <h1 className="text-4xl font-bold mb-2">About Me</h1>
        <p className="text-lg">Hi, I'm Brijesh Thakrar - A Versatile Developer with a Passion for Data-Driven Solutions and Cutting-Edge Technologies</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/2">
            <h2 className="text-2xl font-semibold mb-2 text-gray-800">About Me</h2>
            <p className="mb-4 text-gray-700">
              I'm a developer working on innovative projects like a Price Comparison App and a Parking Zone Monitoring System. I enjoy leveraging technology to solve real-world problems. When I'm not coding, I'm learning new skills in deep learning and web development.
            </p>
            <a
              href="https://github.com/brij0"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gray-800 text-white px-6 py-2 rounded-lg mt-2 transition hover:bg-gray-600"
            >
              <i className="fab fa-github mr-2" /> Visit My GitHub
            </a>
          </div>
          <div className="md:w-1/2">
            <h2 className="text-2xl font-semibold mb-2 text-gray-800">Contact Me</h2>
            <p className="mb-2"><strong>Email:</strong> <a href="mailto:bthakrar@uoguelph.ca" className="text-purple-700 hover:underline">bthakrar@uoguelph.ca</a></p>
            <p><strong>Fun Fact:</strong> I'm not on social media, but I'm always learning!</p>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">Technical Skills</h2>
          <p><strong>Languages:</strong> Python, Java, C/C++, JavaScript, SQL, Verilog, VHDL</p>
          <p><strong>Frameworks:</strong> TensorFlow, PyTorch, Django, React, Node.js</p>
          <p><strong>Tools:</strong> Git, Visual Studio Code, Jira, IntelliJ IDEA, Jupyter Notebook</p>
          <p><strong>Libraries:</strong> Pandas, NumPy, Matplotlib, Selenium, BeautifulSoup</p>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">Projects</h2>
          <ul className="list-none pl-0">
            <li className="mb-2"><span className="text-purple-700 mr-2">✔</span><strong>University Course Calendar Automation:</strong> Automated academic event extraction and Outlook integration using LLaMA and Python.</li>
            <li className="mb-2"><span className="text-purple-700 mr-2">✔</span><strong>Price Comparator App:</strong> Scaled Python web scraper for over 5,000 URLs, integrated MySQL for storage, and added a recommendation engine using OCR.</li>
            <li className="mb-2"><span className="text-purple-700 mr-2">✔</span><strong>Parking Zone Monitoring System:</strong> Developed a YOLOv8-based license plate recognition system achieving 90% accuracy.</li>
            <li className="mb-2"><span className="text-purple-700 mr-2">✔</span><strong>Study Permit Analysis:</strong> Created a Power BI dashboard visualizing trends in Canadian study permits over a decade.</li>
          </ul>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">What I'm Learning</h2>
          <p><strong>Deep Learning Frameworks:</strong> PyTorch, TensorFlow</p>
          <p><strong>Data Visualization Tools:</strong> Power BI, Matplotlib, DAX</p>
          <p><strong>Web Development:</strong> React, Node.js, Django</p>
        </div>
      </div>
    </div>
  );
}