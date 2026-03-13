export type Lang = 'de' | 'en'

export const translations = {
  de: {
    intro: {
      title: 'FBL Allstar Voting',
      p1: 'Hier können Sie Ihre Stimmen für das Allstar-Voting der 1. Damen- und Herren-Bundesliga abgeben.',
      p2: 'Zur Teilnahme am Voting müssen Sie in der ersten oder zweiten Bundesliga lizenziert sein oder als Trainer tätig sein.',
      p3: 'Jede Person darf nur einmal abstimmen!',
      p4: 'Nach dem Start wählen Sie zuerst Ihre Liga (Damen oder Herren). Anschließend durchlaufen Sie die einzelnen Kategorien: Allstar-Auswahl, MVP, Trainer, Fair-Play, Rookie of the Season, Schiedsrichter-Paar und Sonderpreis. Am Ende füllen Sie noch ein kurzes Abschlussformular aus und geben Ihre Stimmen verbindlich ab.',
      p5: 'Sie können jederzeit zwischen den Schritten zurückgehen und Ihre Angaben anpassen, bis Sie die Abstimmung final abschließen.',
      start: 'Start',
    },
    progress: {
      stepOf: 'Schritt',
      of: 'von',
      steps: ['Allstar', 'MVP', 'Trainer', 'Fair Play', 'Rookie', 'Schiri', 'Sonder', 'Fertig'],
    },
    lang: {
      de: 'Deutsch',
      en: 'English',
    },
  },
  en: {
    intro: {
      title: 'FBL Allstar Voting',
      p1: 'Here you can submit your votes for the Allstar Voting of the 1st Men\'s and Women\'s Bundesliga.',
      p2: 'To participate in the voting you must be licensed in the first or second Bundesliga, or be a coach.',
      p3: 'Each person may only vote once!',
      p4: 'After starting, you first choose your league (Women or Men). Then you go through the categories: Allstar selection, MVP, Coach, Fair Play, Rookie of the Season, Referee Pair, and Special Award. At the end you fill in a short form and submit your votes.',
      p5: 'You can go back between steps and change your choices at any time until you finally submit the vote.',
      start: 'Start',
    },
    progress: {
      stepOf: 'Step',
      of: 'of',
      steps: ['Allstar', 'MVP', 'Coach', 'Fair Play', 'Rookie', 'Referee', 'Special', 'Finish'],
    },
    lang: {
      de: 'German',
      en: 'English',
    },
  },
} as const
