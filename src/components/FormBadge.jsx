export default function FormBadge({ value }) {
  const styles = {
    V: "bg-green-500 text-white",
    N: "bg-yellow-400 text-black",
    D: "bg-red-500 text-white",
  };

  return (
    <span
      className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${styles[value]}`}
    >
      {value}
    </span>
  );
}
