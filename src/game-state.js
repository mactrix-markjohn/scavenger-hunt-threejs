// GameState manages scores, scanned targets, progress, and local persistence.

export class GameState {
  constructor() {
    this.score = 0
    this.scannedTargets = [] // List of scanned target names
    this.totalTargets = 2

    // Target configuration mapping target name to its rewards and game metadata
    this.targetsConfig = {
      'image-target-atomic': {
        title: 'Atomic Secrets Unlocked! ⚛️',
        description: 'You scanned the Atomic Cover! The microscopic world of atoms is yours.',
        points: 100,
        nextClue: 'Next Objective: Find the Power marker and scan the cover to complete the quest!',
      },
      'image-target-power': {
        title: 'Power of Chess Unlocked! 👑',
        description: 'You scanned the Power Cover! Command the chessboard and secure victory.',
        points: 150,
        nextClue: 'Quest Completed! Enter your email to claim your grand giveaway reward!',
      }
    }

    this.loadFromLocalStorage()
  }

  // Load progress from localStorage
  loadFromLocalStorage() {
    try {
      const storedScanned = localStorage.getItem('scavenger_scanned_targets')
      const storedScore = localStorage.getItem('scavenger_score')
      
      if (storedScanned) {
        this.scannedTargets = JSON.parse(storedScanned)
      }
      if (storedScore) {
        this.score = parseInt(storedScore, 10) || 0
      }
    } catch (e) {
      console.warn('LocalStorage is not available:', e)
    }
  }

  // Save progress to localStorage
  saveToLocalStorage() {
    try {
      localStorage.setItem('scavenger_scanned_targets', JSON.stringify(this.scannedTargets))
      localStorage.setItem('scavenger_score', this.score.toString())
    } catch (e) {
      console.warn('Unable to save to LocalStorage:', e)
    }
  }

  // Check if target has already been scanned
  isTargetScanned(targetName) {
    return this.scannedTargets.includes(targetName)
  }

  // Try scanning a target. Returns reward data if successful, null if already scanned or invalid.
  scanTarget(targetName) {
    // If not a valid target in our config, ignore
    if (!this.targetsConfig[targetName]) {
      return null
    }

    // If already scanned, ignore
    if (this.isTargetScanned(targetName)) {
      return null
    }

    // Mark as scanned
    this.scannedTargets.push(targetName)
    
    const targetData = this.targetsConfig[targetName]
    this.score += targetData.points

    this.saveToLocalStorage()

    return {
      name: targetName,
      title: targetData.title,
      description: targetData.description,
      points: targetData.points,
      totalScore: this.score,
      progress: this.scannedTargets.length,
      nextClue: targetData.nextClue,
      isFinished: this.scannedTargets.length === this.totalTargets
    }
  }

  // Get clue text based on current scan progress
  getCurrentClue() {
    if (this.scannedTargets.length === 0) {
      return 'Locate and scan the Atomic Cover to start your scavenger hunt!'
    }
    
    // Find the first target in order that has not been scanned yet
    const targetOrder = ['image-target-atomic', 'image-target-power']
    for (const targetName of targetOrder) {
      if (!this.isTargetScanned(targetName)) {
        // Return nextClue of the *last scanned* target
        const lastScannedIndex = targetOrder.indexOf(targetName) - 1
        if (lastScannedIndex >= 0) {
          const lastScannedName = targetOrder[lastScannedIndex]
          return this.targetsConfig[lastScannedName].nextClue
        }
      }
    }

    return 'Scavenger Hunt Completed! Claim your reward in the menu.'
  }

  // Reset progress
  resetGame() {
    this.score = 0
    this.scannedTargets = []
    this.saveToLocalStorage()
  }
}
