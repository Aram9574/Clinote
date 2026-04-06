interface WordCounterProps {
  count: number
}

export function WordCounter({ count }: WordCounterProps) {
  const color = count < 20 ? 'text-amber-400' : count > 2000 ? 'text-red-400' : 'text-teal-400'
  return (
    <span className={`text-xs font-mono ${color}`}>
      {count} palabras
    </span>
  )
}
