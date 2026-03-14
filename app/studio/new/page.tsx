import { createGame } from '@/app/actions'
import { AnimatedCreate } from '@/components/AnimatedCreate'

export default function NewWorldPage() {
  return <AnimatedCreate createGameAction={createGame} />
}
