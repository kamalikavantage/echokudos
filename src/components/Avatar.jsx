function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Avatar({ person, size = 40 }) {
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold text-white shrink-0 shadow-sm ring-2 ring-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, ${person.color}, ${person.color}cc)`,
      }}
      title={person.name}
    >
      {initials(person.name)}
    </div>
  );
}
