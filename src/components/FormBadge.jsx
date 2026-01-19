export default function FormBadge({ value }) {
  const colors = {
    V: "bg-green-300",
    N: "bg-yellow-300 text-black",
    D: "bg-red-300",
  };

  return (
    <span
      className={`
        ${colors[value] || "bg-gray-400"}
        text-white
        text-[6px]        /* 🔥 très petit */
        font-bold
        w-3 h-3           /* 🔥 taille compacte */
        flex items-center justify-center
        rounded
      `}
    >
      {value}
    </span>
  );
}
