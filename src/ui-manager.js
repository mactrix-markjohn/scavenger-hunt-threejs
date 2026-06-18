// UIManager manages HTML/CSS screen updates, HUD metrics, and modal dialogs.

export class UIManager {
  constructor() {
    // Cache DOM element references
    this.scoreText = document.getElementById('score-text')
    this.progressText = document.getElementById('progress-text')
    this.clueText = document.getElementById('clue-text')
    
    this.foundModal = document.getElementById('found-modal')
    this.foundTitle = document.getElementById('found-title')
    this.foundBody = document.getElementById('found-body')
    this.foundPoints = document.getElementById('found-points')
    this.foundBtn = document.getElementById('found-btn')
    
    this.gameoverModal = document.getElementById('gameover-modal')
    this.promoCodeText = document.getElementById('promo-code')
    this.claimEmail = document.getElementById('claim-email')
    this.claimBtn = document.getElementById('claim-btn')
  }

  // Updates stats and clues on the active HUD overlay
  updateHUD(score, progressCount, totalCount, nextClue) {
    if (this.scoreText) {
      this.scoreText.innerText = `${score} PTS`
    }
    if (this.progressText) {
      this.progressText.innerText = `${progressCount}/${totalCount}`
    }
    if (this.clueText) {
      this.clueText.innerText = nextClue
    }
  }

  // Displays popup when a target is successfully scanned
  showFoundModal(title, body, points, onContinue) {
    if (!this.foundModal) return

    this.foundTitle.innerText = title
    this.foundBody.innerText = body
    this.foundPoints.innerText = `+${points}`

    // Remove any old event listeners
    const newBtn = this.foundBtn.cloneNode(true)
    this.foundBtn.parentNode.replaceChild(newBtn, this.foundBtn)
    this.foundBtn = newBtn

    // Register close logic
    this.foundBtn.addEventListener('click', () => {
      this.foundModal.classList.remove('active')
      if (onContinue) onContinue()
    })

    this.foundModal.classList.add('active')
  }

  // Displays game completion screen and email entry form
  showGameOverModal(promoCode, onClaim) {
    if (!this.gameoverModal) return

    this.promoCodeText.innerText = promoCode

    // Remove old listeners
    const newBtn = this.claimBtn.cloneNode(true)
    this.claimBtn.parentNode.replaceChild(newBtn, this.claimBtn)
    this.claimBtn = newBtn

    this.claimBtn.addEventListener('click', (e) => {
      e.preventDefault()
      const email = this.claimEmail.value
      
      if (!email || !email.includes('@')) {
        alert('Please enter a valid email address!')
        return
      }

      if (onClaim) {
        onClaim(email)
      }
    })

    this.gameoverModal.classList.add('active')
  }

  // Hide all modals
  hideAllModals() {
    if (this.foundModal) this.foundModal.classList.remove('active')
    if (this.gameoverModal) this.gameoverModal.classList.remove('active')
  }
}
