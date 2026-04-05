import { type MusicAdapter, type PlayerState } from "./types"; // 🟢 Agregamos 'type'
export class MockPlayer implements MusicAdapter {
  private state: PlayerState
  private interval?: any
  private listener?: (s: PlayerState)=>void

  constructor() {
    this.state = {
      isPlaying:false,
      trackName:"Focus Session",
      artist:"Pomody",
      albumArt:"/lofi.jpg",
      progressMs:0,
      durationMs:180000
    }
  }

  play = async () => {
    this.state.isPlaying = true

    this.interval = setInterval(()=>{
      this.state.progressMs += 1000
      this.listener?.({...this.state})
    },1000)
  }

  pause = async () => {
    this.state.isPlaying=false
    clearInterval(this.interval)
  }

  next = async ()=>{}
  previous = async ()=>{}

  openExternal(){
    window.open(
      "https://open.spotify.com/playlist/37i9dQZF1DX8NTLI2TtZa6",
      "_blank"
    )
  }

  subscribe(cb:any){
    this.listener = cb
    cb(this.state)
  }
}