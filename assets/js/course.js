// Course outline. A lesson becomes clickable when `ready: true` and a
// matching file exists at /lessons/<id>.html.
window.COURSE = {
  title: 'Snowflake Fundamentals & Cortex Code',
  modules: [
    {
      title: 'Module 1 · Foundations',
      lessons: [
        { id: '1-1', title: 'What is Snowflake?', mins: 20, ready: true },
        { id: '1-2', title: 'Storage vs compute', mins: 12, ready: true },
        { id: '1-3', title: 'Virtual warehouses', mins: 15, ready: true },
        { id: '1-4', title: 'Credits and cost', mins: 12, ready: true },
        { id: '1-5', title: 'Database, schema, table', mins: 25, ready: true },
        { id: '1-6', title: 'The three layers', mins: 25, ready: true },
      ],
    },
    {
      title: 'Module 2 · Working with data',
      lessons: [
        { id: '2-1', title: 'Loading data', mins: 30, ready: true },
        { id: '2-2', title: 'Time Travel & Fail-safe', mins: 25, ready: true },
        { id: '2-3', title: 'Zero-copy cloning', mins: 20, ready: true },
        { id: '2-4', title: 'Secure data sharing', mins: 25, ready: true },
        { id: '2-5', title: 'Roles and access control', mins: 30, ready: true },
        { id: '2-6', title: 'Streams and tasks', mins: 35, ready: true },
      ],
    },
    {
      title: 'Module 3 · AI and development',
      lessons: [
        { id: '3-1', title: 'Snowpark', mins: 35, ready: true },
        { id: '3-2', title: 'Cortex AI functions', mins: 35, ready: true },
        { id: '3-3', title: 'Cortex Code (CoCo)', mins: 40, ready: true },
      ],
    },
    {
      title: 'Module 4 · Review',
      lessons: [
        { id: '4-1', title: 'Cheat sheet', mins: 5, ready: true },
        { id: '4-2', title: 'Interview Q&A', mins: 30, ready: true },
        { id: '4-3', title: 'Final assessment', mins: 25, ready: true },
      ],
    },
  ],
};

window.COURSE.allLessons = window.COURSE.modules.flatMap(m => m.lessons);
