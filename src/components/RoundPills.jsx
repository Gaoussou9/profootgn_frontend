export default function RoundPills({ rounds=[], activeId=null, onSelect=()=>{} }){
  return (
    <div className="relative">
      <div className="flex gap-2 overflow-x-auto no-scrollbar fade-x px-1 py-2">
        {rounds.map(r => {
          const active = r.id === activeId;
          return (
            <button
              key={r.id}
              onClick={()=>onSelect(r.id)}
              className={[
                "shrink-0 px-3 py-1.5 rounded-full text-sm ring-1 transition",
                active
                  ? "bg-blue-600 text-white ring-blue-600"
                  : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
              ].join(" ")}
            >
              {r.label ?? r.name ?? r.code ?? `J${r.order||""}`}
            </button>
          );
        })}
      </div>
    </div>
  );
}
