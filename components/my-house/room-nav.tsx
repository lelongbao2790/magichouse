"use client"

import { Lock } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import type { RoomTab } from "@/lib/services/house-items"

interface RoomNavProps {
  rooms: RoomTab[]
  activeRoom: string
  onSelectRoom: (roomId: string) => void
}

// Client-owned emoji per room id (domain-entities.md: Room rows carry no emoji field
// server-side) — RoomNav maps id -> emoji itself; falls back to a generic house emoji
// for any future room id not yet listed here.
const ROOM_EMOJI: Record<string, string> = {
  bedroom: "🛏️",
  kitchen: "🍳",
  living_room: "🛋️",
  garden: "🌳",
}

// data-testid slugs use hyphens even where the room id uses an underscore
// (`living_room` -> `room-living-room`), matching test-case-design.md exactly.
function roomTestId(roomId: string): string {
  return `room-${roomId.replace(/_/g, "-")}`
}

export function RoomNav({ rooms, activeRoom, onSelectRoom }: RoomNavProps) {
  const { t } = useLanguage()

  return (
    <div className="flex flex-wrap gap-2" data-testid="room-nav">
      {rooms.map((room) => {
        const emoji = ROOM_EMOJI[room.id] ?? "🏠"

        // BR-6: a locked room has no click handler wired at all — not merely a
        // disabled-but-clickable element.
        if (room.locked) {
          return (
            <div
              key={room.id}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-base bg-muted text-muted-foreground opacity-60 cursor-not-allowed select-none"
              data-testid={roomTestId(room.id)}
              data-locked="true"
            >
              <span className="text-xl">{emoji}</span>
              <span>{room.label}</span>
              <Lock className="w-4 h-4" />
              <span className="text-xs">{t("house", "comingSoon")}</span>
            </div>
          )
        }

        const isActive = room.id === activeRoom

        return (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-base transition-all duration-200 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-lg scale-105"
                : "bg-card text-card-foreground hover:bg-secondary shadow-md"
            }`}
            data-testid={roomTestId(room.id)}
            data-locked="false"
            data-active={isActive ? "true" : "false"}
          >
            <span className="text-xl">{emoji}</span>
            <span>{room.label}</span>
          </button>
        )
      })}
    </div>
  )
}
