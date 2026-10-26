export interface StoryMoment {
  date: string
  title: string
  description: string
  image: string
}

export interface Memory {
  title: string
  category: string
  date: string
  caption: string
  image: string
}

export interface AnniversaryContent {
  story: StoryMoment[]
  memories: Memory[]
  reasons: string[]
  letter: string
  puzzleImage: string
  surpriseImage: string
  surpriseLetter: string
}
