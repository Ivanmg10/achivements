import type { VaultGuideText } from './vaultGuide'

/** "How Vault Points work" in the languages besides English and Spanish (see vaultGuide.ts). */

export const de: VaultGuideText = {
  title: 'So funktionieren Vault-Punkte',
  description: 'Wie CheevoVault Erfolge von RetroAchievements, Steam und PlayStation bewertet, damit jede Plattform gleich viel zählt.',
  heading: 'So funktionieren Vault-Punkte',
  intro:
    'Jede Plattform zählt Erfolge auf ihre Weise: Xbox in Gamerscore, PlayStation in Bronze, Silber und Gold, RetroAchievements in Punkten, Steam gar nicht. Wer das einfach addiert, macht die Plattform wichtiger als das Spielen. Vault-Punkte messen jeden Erfolg gleich, egal wo er verdient wurde.',
  back: 'Zurück zu den Ranglisten',
  bag: {
    heading: 'Jedes Spiel ist bis zu 1.000 Punkte wert',
    text: 'Auf jeder Plattform. Seine Erfolge teilen sich diese 1.000: Ein Spiel mit 5.000 Erfolgen ist nicht mehr wert als eines mit 50, es teilt sie nur kleiner auf. Der größte Teil wird gleichmäßig verteilt; ein Viertel folgt dem, was die Plattform jedem Erfolg zuschreibt (Gamerscore, Trophäenstufe, RA-Punkte).',
  },
  rarity: {
    heading: 'Seltenere Erfolge sind mehr wert',
    text: 'Jeder Erfolg wird mit dem häufigsten Erfolg desselben Spiels verglichen, daher ist es egal, ob eine Plattform alle Besitzer oder nur die Spieler zählt. Zehnmal seltener bringt noch einmal seinen Wert, bis zum Vierfachen.',
    colRarity: 'Im Vergleich zum häufigsten Erfolg des Spiels',
    colMultiplier: 'Wert',
    everyone: 'Alle, die es spielen',
  },
  difficulty: {
    heading: 'Schwerere Spiele sind mehr wert',
    text: 'Wie viele von denen, die ein Spiel beginnen, seinen schwersten Erfolg erreichen. Ein Spiel, das fast alle an einem Nachmittag beenden, ist weniger wert; ein anspruchsvolles zählt voll. Das gilt für alles, was du in diesem Spiel verdienst.',
    colReach: 'Wer den schwersten Erfolg erreicht',
    colMultiplier: 'Das Spiel ist wert',
  },
  extras: {
    heading: 'Abschließen, Softcore und doppelte Spiele',
    text: 'Ein paar Regeln dazu:',
    points: [
      'Ein Spiel abzuschließen (100 %) bringt ein Fünftel dazu.',
      'Auf RetroAchievements zählen Softcore-Erfolge halb, und nur Hardcore schließt ein Spiel ab.',
      'Dasselbe Spiel noch einmal auf einer Plattform (andere Region, PS4 und PS5) zählt beim zweiten Mal halb und danach ein Zehntel.',
    ],
  },
  example: {
    heading: 'Was das praktisch bedeutet',
    text: 'Abgeschlossene Spiele mit Beispiel-Seltenheiten. Dasselbe anspruchsvolle Spiel landet auf jeder Plattform nah beieinander, und ein Spiel, das jeder an einem Nachmittag beendet, ist etwa ein Drittel davon wert.',
    aaa: 'Dasselbe anspruchsvolle Spiel, abgeschlossen',
    platforms: { psn: 'PlayStation', steam: 'Steam', xbox: 'Xbox', ra: 'RetroAchievements (ein Retro-Spiel gleicher Länge)' },
    quick: 'Eine Platin-Trophäe in einer Stunde',
    spam: 'Ein Steam-Spiel mit 5.000 Erfolgen',
    easyNote: 'Beispielzahlen, um die Verhältnisse zu zeigen, keine echten Spiele.',
  },
  notCounted: {
    heading: 'Was nicht zählt',
    text: 'Deine Ranglisten folgen deinen eigenen Entscheidungen:',
    points: [
      'Ausgeblendete Spiele und Konsolen, die du in deinen Einstellungen abgewählt hast.',
      'Steam-Spiele, bei denen fast alle Erfolge in derselben Sekunde freigeschaltet wurden (das Zeichen eines Freischalt-Tools), bis ein Admin sie prüft.',
      'Ein Konto, dessen Verknüpfung du gelöst hast.',
    ],
  },
  levels: {
    heading: 'Stufen und Ränge',
    text: 'Deine Stufe ergibt sich aus deinen Gesamtpunkten: Die ersten kommen schnell, jede weitere braucht etwas mehr, und es gibt kein Ende.',
    colTier: 'Rang',
    colLevels: 'Stufen',
    colFrom: 'Ab',
  },
  updates: {
    heading: 'Wann sich Punkte ändern',
    text: 'Punkte werden vorab berechnet, nicht erst, wenn eine Seite sie anfragt:',
    points: [
      'Wenn du eine Plattform verknüpfst, geht es sofort los. Nach Sekunden erscheinst du mit einer Schätzung (mit ≈ markiert) in den Ranglisten, und die genaue Zahl folgt, während deine Spiele gelesen werden: Sekunden für Steam und PlayStation, etwas länger für eine große RetroAchievements-Bibliothek.',
      'Während du CheevoVault nutzt, werden deine Punkte alle paar Stunden aktualisiert, und es werden nur die seitdem gespielten Spiele gelesen.',
      'Die Seltenheit ändert sich langsam, je mehr Leute spielen, daher können sich deine Punkte leicht bewegen, ohne dass du etwas tust.',
    ],
  },
  faq: [
    { q: 'Warum nicht einfach Gamerscore, Trophäen und RA-Punkte addieren?', a: 'Weil dasselbe Spiel auf Steam 49 und auf PlayStation 1.440 wert wäre. Vault-Punkte nutzen, was alle Plattformen gemeinsam haben: wie viele Spieler jeden Erfolg haben.' },
    { q: 'Bringt eine Plattform mehr Punkte als eine andere?', a: 'Nein: Es ist so gebaut, dass das nicht passiert, und die Admins prüfen mit echten Daten, dass ein typisches Spiel jeder Plattform gleich viel wert ist.' },
    { q: 'Kann ich die Ranglisten verlassen?', a: 'Ja, in deinen Einstellungen (oder indem du dein Profil privat machst). Deine Punkte werden weiter berechnet, nur für dich.' },
    { q: 'Die Ranglisten sind eine Beta: Was kann sich ändern?', a: 'Vor allem die feinen Zahlen der Formel, falls echte Daten zeigen, dass eine Plattform abweicht. Dann werden die Punkte aller auf dieselbe Weise neu berechnet.' },
  ],
}

export const fr: VaultGuideText = {
  title: 'Comment fonctionnent les Points Vault',
  description: 'Comment CheevoVault note les succès de RetroAchievements, Steam et PlayStation pour que chaque plateforme vaille autant.',
  heading: 'Comment fonctionnent les Points Vault',
  intro:
    'Chaque plateforme compte les succès à sa façon : Xbox en gamerscore, PlayStation en bronze, argent et or, RetroAchievements en points, et Steam pas du tout. Les additionner donnerait plus de poids à la plateforme qu’à ta façon de jouer. Les Points Vault mesurent chaque succès de la même manière, où qu’il ait été obtenu.',
  back: 'Retour aux classements',
  bag: {
    heading: 'Chaque jeu vaut jusqu’à 1 000 points',
    text: 'Sur n’importe quelle plateforme. Ses succès se partagent ces 1 000 : un jeu avec 5 000 succès ne vaut pas plus qu’un jeu avec 50, il les découpe seulement en plus petits morceaux. La plus grande part est répartie à égalité ; un quart suit ce que la plateforme dit de chacun (gamerscore, grade du trophée, points RA).',
  },
  rarity: {
    heading: 'Les succès plus rares valent plus',
    text: 'Chaque succès est comparé au plus courant du même jeu, donc peu importe qu’une plateforme compte tous les propriétaires ou seulement ceux qui ont joué. Dix fois plus rare ajoute une fois sa valeur, jusqu’à quatre fois.',
    colRarity: 'Par rapport au succès le plus courant du jeu',
    colMultiplier: 'Vaut',
    everyone: 'Tous ceux qui y jouent',
  },
  difficulty: {
    heading: 'Les jeux plus durs valent plus',
    text: 'Combien de ceux qui commencent un jeu atteignent son succès le plus difficile. Un jeu que presque tout le monde finit en un après-midi vaut moins ; un jeu exigeant vaut tout. Cela s’applique à tout ce que tu gagnes dans ce jeu.',
    colReach: 'Qui atteint son succès le plus dur',
    colMultiplier: 'Le jeu vaut',
  },
  extras: {
    heading: 'Terminer, softcore et jeux en double',
    text: 'Quelques règles en plus :',
    points: [
      'Terminer un jeu (100 %) ajoute un cinquième.',
      'Sur RetroAchievements, les succès en softcore comptent moitié, et seul le hardcore termine un jeu.',
      'Le même jeu listé à nouveau sur une plateforme (autre région, PS4 et PS5) compte moitié la deuxième fois, puis un dixième.',
    ],
  },
  example: {
    heading: 'Ce que cela donne en pratique',
    text: 'Des jeux terminés, avec des raretés d’exemple. Le même jeu exigeant arrive proche sur chaque plateforme, et un jeu que n’importe qui termine en un après-midi en vaut environ un tiers.',
    aaa: 'Le même jeu exigeant, terminé',
    platforms: { psn: 'PlayStation', steam: 'Steam', xbox: 'Xbox', ra: 'RetroAchievements (un jeu rétro aussi long)' },
    quick: 'Un platine en une heure',
    spam: 'Un jeu Steam avec 5 000 succès',
    easyNote: 'Chiffres d’exemple pour montrer les proportions, pas de vrais jeux.',
  },
  notCounted: {
    heading: 'Ce qui ne compte pas',
    text: 'Tes classements suivent tes propres choix :',
    points: [
      'Les jeux que tu as masqués et les consoles décochées dans tes préférences.',
      'Les jeux Steam dont presque tous les succès ont été débloqués à la même seconde (la marque d’un outil de déblocage), jusqu’à ce qu’un admin les examine.',
      'Un compte que tu as délié.',
    ],
  },
  levels: {
    heading: 'Niveaux et rangs',
    text: 'Ton niveau vient de tes points totaux : les premiers arrivent vite, chacun des suivants demande un peu plus, et il n’y a pas de limite.',
    colTier: 'Rang',
    colLevels: 'Niveaux',
    colFrom: 'À partir de',
  },
  updates: {
    heading: 'Quand les points changent',
    text: 'Les points sont calculés à l’avance, pas quand une page les demande :',
    points: [
      'Quand tu lies une plateforme, cela commence tout de suite. Tu apparais en quelques secondes dans les classements avec une estimation (marquée ≈), et le chiffre exact suit à mesure que tes jeux sont lus : quelques secondes pour Steam et PlayStation, un peu plus pour une grande bibliothèque RetroAchievements.',
      'Pendant que tu utilises CheevoVault, tes points sont mis à jour toutes les quelques heures, en lisant seulement les jeux joués depuis.',
      'La rareté évolue lentement à mesure que plus de gens jouent, donc tes points peuvent bouger un peu sans que tu fasses rien.',
    ],
  },
  faq: [
    { q: 'Pourquoi ne pas simplement additionner gamerscore, trophées et points RA ?', a: 'Parce que le même jeu vaudrait 49 sur Steam et 1 440 sur PlayStation. Les Points Vault utilisent ce que toutes les plateformes ont en commun : combien de joueurs ont chaque succès.' },
    { q: 'Une plateforme donne-t-elle plus de points qu’une autre ?', a: 'Non : c’est conçu pour que non, et les admins vérifient avec de vraies données que le jeu typique de chaque plateforme vaut autant.' },
    { q: 'Puis-je quitter les classements ?', a: 'Oui, depuis tes préférences (ou en rendant ton profil privé). Tes points sont toujours calculés, pour toi seul.' },
    { q: 'Les classements sont en bêta : qu’est-ce qui peut changer ?', a: 'Surtout les réglages fins de la formule, si les vraies données montrent qu’une plateforme s’écarte. Dans ce cas, les points de tous sont recalculés de la même façon.' },
  ],
}

export const it: VaultGuideText = {
  title: 'Come funzionano i Punti Vault',
  description: 'Come CheevoVault valuta gli obiettivi di RetroAchievements, Steam e PlayStation perché ogni piattaforma valga lo stesso.',
  heading: 'Come funzionano i Punti Vault',
  intro:
    'Ogni piattaforma conta gli obiettivi a modo suo: Xbox in gamerscore, PlayStation in bronzo, argento e oro, RetroAchievements in punti, Steam per niente. Sommarli darebbe più peso alla piattaforma che al modo in cui giochi. I Punti Vault misurano ogni obiettivo allo stesso modo, ovunque sia stato ottenuto.',
  back: 'Torna alle classifiche',
  bag: {
    heading: 'Ogni gioco vale fino a 1.000 punti',
    text: 'Su qualsiasi piattaforma. I suoi obiettivi si dividono quei 1.000: un gioco con 5.000 obiettivi non vale più di uno con 50, li divide solo in pezzi più piccoli. La maggior parte si ripartisce in parti uguali; un quarto segue quanto la piattaforma dice che vale ciascuno (gamerscore, grado del trofeo, punti RA).',
  },
  rarity: {
    heading: 'Gli obiettivi più rari valgono di più',
    text: 'Ogni obiettivo è confrontato con il più comune dello stesso gioco, quindi non importa se una piattaforma conta tutti i possessori o solo chi ha giocato. Dieci volte più raro aggiunge una volta il suo valore, fino a quattro volte.',
    colRarity: 'Rispetto all’obiettivo più comune del gioco',
    colMultiplier: 'Vale',
    everyone: 'Tutti quelli che ci giocano',
  },
  difficulty: {
    heading: 'I giochi più difficili valgono di più',
    text: 'Quanti di quelli che iniziano un gioco arrivano al suo obiettivo più difficile. Un gioco che quasi tutti finiscono in un pomeriggio vale meno; uno impegnativo vale per intero. Vale per tutto ciò che ottieni in quel gioco.',
    colReach: 'Chi arriva al suo obiettivo più difficile',
    colMultiplier: 'Il gioco vale',
  },
  extras: {
    heading: 'Completare, softcore e giochi ripetuti',
    text: 'Qualche regola in più:',
    points: [
      'Completare un gioco (100%) aggiunge un quinto.',
      'Su RetroAchievements gli obiettivi in softcore contano la metà, e solo l’hardcore completa un gioco.',
      'Lo stesso gioco ripetuto su una piattaforma (altra regione, PS4 e PS5) conta la metà la seconda volta, poi un decimo.',
    ],
  },
  example: {
    heading: 'Cosa significa in pratica',
    text: 'Giochi completati, con rarità di esempio. Lo stesso gioco impegnativo risulta simile su ogni piattaforma, e un gioco che chiunque finisce in un pomeriggio ne vale circa un terzo.',
    aaa: 'Lo stesso gioco impegnativo, completato',
    platforms: { psn: 'PlayStation', steam: 'Steam', xbox: 'Xbox', ra: 'RetroAchievements (un retro altrettanto lungo)' },
    quick: 'Un platino in un’ora',
    spam: 'Un gioco Steam con 5.000 obiettivi',
    easyNote: 'Cifre di esempio per mostrare le proporzioni, non giochi reali.',
  },
  notCounted: {
    heading: 'Cosa non conta',
    text: 'Le tue classifiche seguono le tue scelte:',
    points: [
      'I giochi che hai nascosto e le console deselezionate nelle preferenze.',
      'I giochi Steam con quasi tutti gli obiettivi sbloccati nello stesso secondo (il segno di uno strumento di sblocco), finché un admin non li controlla.',
      'Un account che hai scollegato.',
    ],
  },
  levels: {
    heading: 'Livelli e gradi',
    text: 'Il tuo livello deriva dai punti totali: i primi arrivano presto, ognuno dei successivi costa un po’ di più, e non c’è un limite.',
    colTier: 'Grado',
    colLevels: 'Livelli',
    colFrom: 'Da',
  },
  updates: {
    heading: 'Quando cambiano i punti',
    text: 'I punti si calcolano in anticipo, non quando una pagina li chiede:',
    points: [
      'Quando colleghi una piattaforma, inizia subito. Compari nelle classifiche in pochi secondi con una stima (segnata ≈), e la cifra esatta arriva man mano che i tuoi giochi vengono letti: secondi per Steam e PlayStation, un po’ di più per una grande libreria RetroAchievements.',
      'Mentre usi CheevoVault, i tuoi punti si aggiornano ogni poche ore, leggendo solo i giochi giocati da allora.',
      'La rarità cambia lentamente man mano che più persone giocano, quindi i tuoi punti possono muoversi un po’ senza che tu faccia nulla.',
    ],
  },
  faq: [
    { q: 'Perché non sommare gamerscore, trofei e punti RA?', a: 'Perché lo stesso gioco varrebbe 49 su Steam e 1.440 su PlayStation. I Punti Vault usano ciò che tutte le piattaforme hanno in comune: quanti giocatori hanno ogni obiettivo.' },
    { q: 'Una piattaforma dà più punti di un’altra?', a: 'No: è costruito per evitarlo, e gli admin verificano con dati reali che il gioco tipico di ogni piattaforma valga lo stesso.' },
    { q: 'Posso uscire dalle classifiche?', a: 'Sì, dalle preferenze (o rendendo privato il profilo). I tuoi punti continuano a essere calcolati, solo per te.' },
    { q: 'Le classifiche sono in beta: cosa può cambiare?', a: 'Soprattutto i numeri fini della formula, se i dati reali mostrano che una piattaforma si discosta. Se cambiano, i punti di tutti si ricalcolano allo stesso modo.' },
  ],
}

export const ja: VaultGuideText = {
  title: 'Vaultポイントの仕組み',
  description: 'CheevoVaultがRetroAchievements、Steam、PlayStationの実績をどのプラットフォームでも同じ価値になるよう採点する方法。',
  heading: 'Vaultポイントの仕組み',
  intro:
    'プラットフォームごとに実績の数え方は違います。Xboxはゲーマースコア、PlayStationはブロンズ・シルバー・ゴールド、RetroAchievementsはポイント、Steamは数えません。そのまま足すと、どう遊んだかよりどこで遊んだかが重要になってしまいます。Vaultポイントは、どこで獲得したかに関係なく、すべての実績を同じ基準で測ります。',
  back: 'ランキングに戻る',
  bag: {
    heading: 'どのゲームも最大1,000ポイント',
    text: 'どのプラットフォームでも同じです。実績はその1,000を分け合います。実績が5,000個あるゲームも50個のゲームと同じ価値で、細かく分けているだけです。大部分は均等に分け、4分の1はプラットフォームが各実績に与える価値（ゲーマースコア、トロフィーのグレード、RAポイント）に従います。',
  },
  rarity: {
    heading: 'レアな実績ほど価値が高い',
    text: '各実績は同じゲームで最も一般的な実績と比べます。そのため、プラットフォームが所有者全員を数えるか、遊んだ人だけを数えるかは関係ありません。10倍レアになるごとに価値がもう1倍分増え、最大4倍です。',
    colRarity: 'ゲーム内で最も一般的な実績と比べて',
    colMultiplier: '価値',
    everyone: '遊んだ全員',
  },
  difficulty: {
    heading: '難しいゲームほど価値が高い',
    text: 'ゲームを始めた人のうち、どれだけが最も難しい実績に到達するか。ほぼ全員が午後のうちにクリアするゲームは価値が下がり、手ごわいゲームは満額です。そのゲームで獲得したすべてに適用されます。',
    colReach: '最難関の実績に到達する人',
    colMultiplier: 'ゲームの価値',
  },
  extras: {
    heading: 'コンプリート、ソフトコア、重複ゲーム',
    text: 'いくつかの追加ルール：',
    points: [
      'ゲームをコンプリート（100%）すると5分の1が加算されます。',
      'RetroAchievementsではソフトコアの実績は半分で、コンプリートはハードコアのみです。',
      '同じプラットフォームで重複したゲーム（別地域、PS4とPS5）は2本目が半分、それ以降は10分の1です。',
    ],
  },
  example: {
    heading: '実際にはこうなります',
    text: 'コンプリートしたゲームの例（レア度は例示）。同じ手ごわいゲームはどのプラットフォームでもほぼ同じになり、誰でも午後に終わるゲームはその約3分の1です。',
    aaa: '同じ手ごわいゲームをコンプリート',
    platforms: { psn: 'PlayStation', steam: 'Steam', xbox: 'Xbox', ra: 'RetroAchievements（同じ長さのレトロゲーム）' },
    quick: '1時間で取れるプラチナ',
    spam: '実績5,000個のSteamゲーム',
    easyNote: '比率を示すための例の数値で、実在のゲームではありません。',
  },
  notCounted: {
    heading: '数えないもの',
    text: 'ランキングはあなた自身の選択に従います：',
    points: [
      '非表示にしたゲームと、設定でチェックを外したコンソール。',
      'ほぼすべての実績が同じ秒に解除されたSteamゲーム（解除ツールの痕跡）。管理者が確認するまで。',
      '連携を解除したアカウント。',
    ],
  },
  levels: {
    heading: 'レベルとランク',
    text: 'レベルは合計ポイントで決まります。最初はすぐ上がり、その後は少しずつ必要ポイントが増え、上限はありません。',
    colTier: 'ランク',
    colLevels: 'レベル',
    colFrom: '必要ポイント',
  },
  updates: {
    heading: 'ポイントが変わるタイミング',
    text: 'ポイントはページが要求したときではなく、事前に計算されます：',
    points: [
      'プラットフォームを連携するとすぐに始まります。数秒で推定値（≈付き）でランキングに表示され、ゲームが読み込まれるにつれて正確な値になります。SteamとPlayStationは数秒、大きなRetroAchievementsライブラリは少し長くかかります。',
      'CheevoVaultを使っている間、ポイントは数時間ごとに更新され、その後に遊んだゲームだけを読み込みます。',
      'レア度は遊ぶ人が増えるにつれてゆっくり変わるため、何もしなくてもポイントが少し動くことがあります。',
    ],
  },
  faq: [
    { q: 'ゲーマースコアやトロフィー、RAポイントをそのまま足さないのはなぜ？', a: '同じゲームがSteamでは49、PlayStationでは1,440になってしまうからです。Vaultポイントはすべてのプラットフォームに共通するもの、つまり各実績を持つプレイヤーの数を使います。' },
    { q: 'プラットフォームによってポイントが多くなる？', a: 'いいえ。そうならないように作られており、管理者が実データで各プラットフォームの典型的なゲームが同じ価値になっているか確認しています。' },
    { q: 'ランキングから外れられる？', a: 'はい、設定から（またはプロフィールを非公開にして）。ポイントは引き続きあなた専用に計算されます。' },
    { q: 'ランキングはベータ版：何が変わる可能性がある？', a: '主に式の細かい数値です。実データでプラットフォームに偏りが見られた場合に調整し、その際は全員のポイントを同じ方法で再計算します。' },
  ],
}

export const pl: VaultGuideText = {
  title: 'Jak działają Punkty Vault',
  description: 'Jak CheevoVault punktuje osiągnięcia z RetroAchievements, Steam i PlayStation, aby każda platforma była warta tyle samo.',
  heading: 'Jak działają Punkty Vault',
  intro:
    'Każda platforma liczy osiągnięcia po swojemu: Xbox w gamerscore, PlayStation w brązie, srebrze i złocie, RetroAchievements w punktach, a Steam wcale. Zsumowanie ich dałoby większą wagę platformie niż temu, jak grasz. Punkty Vault mierzą każde osiągnięcie tak samo, niezależnie od tego, gdzie zostało zdobyte.',
  back: 'Wróć do rankingów',
  bag: {
    heading: 'Każda gra jest warta do 1000 punktów',
    text: 'Na każdej platformie. Jej osiągnięcia dzielą się tymi 1000: gra z 5000 osiągnięć nie jest warta więcej niż gra z 50, tylko dzieli je na mniejsze kawałki. Większość dzielona jest po równo; jedna czwarta idzie za tym, ile platforma przypisuje każdemu (gamerscore, ranga trofeum, punkty RA).',
  },
  rarity: {
    heading: 'Rzadsze osiągnięcia są warte więcej',
    text: 'Każde osiągnięcie porównuje się z najczęstszym w tej samej grze, więc nie ma znaczenia, czy platforma liczy wszystkich właścicieli, czy tylko grających. Dziesięć razy rzadsze dodaje jeszcze raz swoją wartość, maksymalnie czterokrotnie.',
    colRarity: 'W porównaniu z najczęstszym osiągnięciem gry',
    colMultiplier: 'Warte',
    everyone: 'Wszyscy, którzy w nią grają',
  },
  difficulty: {
    heading: 'Trudniejsze gry są warte więcej',
    text: 'Ilu z tych, którzy zaczynają grę, dochodzi do jej najtrudniejszego osiągnięcia. Gra, którą prawie każdy kończy w jedno popołudnie, jest warta mniej; wymagająca jest warta w całości. Dotyczy to wszystkiego, co zdobędziesz w tej grze.',
    colReach: 'Kto dochodzi do najtrudniejszego osiągnięcia',
    colMultiplier: 'Gra jest warta',
  },
  extras: {
    heading: 'Ukończenie, softcore i powtórzone gry',
    text: 'Kilka dodatkowych zasad:',
    points: [
      'Ukończenie gry (100%) dodaje jedną piątą.',
      'W RetroAchievements osiągnięcia w softcore liczą się w połowie, a grę kończy tylko hardcore.',
      'Ta sama gra powtórzona na jednej platformie (inny region, PS4 i PS5) liczy się w połowie za drugim razem, a potem w jednej dziesiątej.',
    ],
  },
  example: {
    heading: 'Co to oznacza w praktyce',
    text: 'Ukończone gry, z przykładową rzadkością. Ta sama wymagająca gra wypada podobnie na każdej platformie, a gra, którą każdy kończy w popołudnie, jest warta mniej więcej jedną trzecią.',
    aaa: 'Ta sama wymagająca gra, ukończona',
    platforms: { psn: 'PlayStation', steam: 'Steam', xbox: 'Xbox', ra: 'RetroAchievements (równie długa gra retro)' },
    quick: 'Platyna w godzinę',
    spam: 'Gra na Steam z 5000 osiągnięć',
    easyNote: 'Przykładowe liczby pokazujące proporcje, nie prawdziwe gry.',
  },
  notCounted: {
    heading: 'Co się nie liczy',
    text: 'Twoje rankingi idą za twoimi wyborami:',
    points: [
      'Gry, które ukryłeś, i konsole odznaczone w ustawieniach.',
      'Gry na Steam, w których prawie wszystkie osiągnięcia odblokowano w tej samej sekundzie (ślad narzędzia do odblokowywania), dopóki admin ich nie sprawdzi.',
      'Konto, które odłączyłeś.',
    ],
  },
  levels: {
    heading: 'Poziomy i rangi',
    text: 'Twój poziom wynika z sumy punktów: pierwsze przychodzą szybko, każdy kolejny wymaga trochę więcej i nie ma limitu.',
    colTier: 'Ranga',
    colLevels: 'Poziomy',
    colFrom: 'Od',
  },
  updates: {
    heading: 'Kiedy zmieniają się punkty',
    text: 'Punkty liczone są z wyprzedzeniem, a nie wtedy, gdy strona o nie prosi:',
    points: [
      'Gdy połączysz platformę, zaczyna się od razu. W kilka sekund pojawiasz się w rankingach z szacunkiem (oznaczonym ≈), a dokładna liczba przychodzi w miarę odczytu gier: sekundy dla Steam i PlayStation, trochę dłużej dla dużej biblioteki RetroAchievements.',
      'Gdy korzystasz z CheevoVault, twoje punkty odświeżają się co kilka godzin, odczytując tylko gry, w które grałeś od tamtej pory.',
      'Rzadkość zmienia się powoli, gdy gra więcej osób, więc twoje punkty mogą się lekko zmienić bez twojego udziału.',
    ],
  },
  faq: [
    { q: 'Dlaczego po prostu nie zsumować gamerscore, trofeów i punktów RA?', a: 'Bo ta sama gra byłaby warta 49 na Steam i 1440 na PlayStation. Punkty Vault używają tego, co wspólne dla wszystkich platform: ilu graczy ma każde osiągnięcie.' },
    { q: 'Czy jakaś platforma daje więcej punktów?', a: 'Nie: system jest zbudowany tak, by tak nie było, a admini sprawdzają na prawdziwych danych, że typowa gra każdej platformy jest warta tyle samo.' },
    { q: 'Czy mogę wyjść z rankingów?', a: 'Tak, w ustawieniach (lub ustawiając profil jako prywatny). Twoje punkty są nadal liczone, tylko dla ciebie.' },
    { q: 'Rankingi są w becie: co może się zmienić?', a: 'Głównie drobne liczby we wzorze, jeśli prawdziwe dane pokażą, że któraś platforma odstaje. Wtedy punkty wszystkich zostaną przeliczone w ten sam sposób.' },
  ],
}

export const pt: VaultGuideText = {
  title: 'Como funcionam os Pontos Vault',
  description: 'Como o CheevoVault pontua as conquistas do RetroAchievements, Steam e PlayStation para que todas as plataformas valham o mesmo.',
  heading: 'Como funcionam os Pontos Vault',
  intro:
    'Cada plataforma conta as conquistas à sua maneira: a Xbox em gamerscore, a PlayStation em bronze, prata e ouro, o RetroAchievements em pontos e a Steam não as conta. Somá-las daria mais peso à plataforma do que à forma como jogas. Os Pontos Vault medem todas as conquistas da mesma maneira, onde quer que as tenhas obtido.',
  back: 'Voltar aos rankings',
  bag: {
    heading: 'Cada jogo vale até 1000 pontos',
    text: 'Em qualquer plataforma. As suas conquistas repartem esses 1000: um jogo com 5000 conquistas não vale mais do que um com 50, apenas as divide em pedaços mais pequenos. A maior parte é repartida por igual; um quarto segue o que a plataforma diz que vale cada uma (gamerscore, grau do troféu, pontos RA).',
  },
  rarity: {
    heading: 'As conquistas mais raras valem mais',
    text: 'Cada conquista é comparada com a mais comum do mesmo jogo, por isso não importa se uma plataforma conta todos os donos ou só quem jogou. Dez vezes mais rara soma mais uma vez o seu valor, até quatro vezes.',
    colRarity: 'Face à conquista mais comum do jogo',
    colMultiplier: 'Vale',
    everyone: 'Todos os que o jogam',
  },
  difficulty: {
    heading: 'Os jogos mais difíceis valem mais',
    text: 'Quantos dos que começam um jogo chegam à sua conquista mais difícil. Um jogo que quase todos acabam numa tarde vale menos; um exigente vale por inteiro. Aplica-se a tudo o que ganhas nesse jogo.',
    colReach: 'Quem chega à conquista mais difícil',
    colMultiplier: 'O jogo vale',
  },
  extras: {
    heading: 'Completar, softcore e jogos repetidos',
    text: 'Mais algumas regras:',
    points: [
      'Completar um jogo (100%) soma mais um quinto.',
      'No RetroAchievements, as conquistas em softcore contam metade, e só o hardcore completa um jogo.',
      'O mesmo jogo repetido numa plataforma (outra região, PS4 e PS5) conta metade da segunda vez, e um décimo a partir daí.',
    ],
  },
  example: {
    heading: 'O que isso significa na prática',
    text: 'Jogos completados, com raridades de exemplo. O mesmo jogo exigente fica parecido em todas as plataformas, e um jogo que qualquer um acaba numa tarde vale mais ou menos um terço.',
    aaa: 'O mesmo jogo exigente, completado',
    platforms: { psn: 'PlayStation', steam: 'Steam', xbox: 'Xbox', ra: 'RetroAchievements (um retro igualmente longo)' },
    quick: 'Uma platina numa hora',
    spam: 'Um jogo da Steam com 5000 conquistas',
    easyNote: 'Números de exemplo para mostrar as proporções, não jogos reais.',
  },
  notCounted: {
    heading: 'O que não conta',
    text: 'Os teus rankings seguem as tuas escolhas:',
    points: [
      'Os jogos que ocultaste e as consolas que desmarcaste nas preferências.',
      'Os jogos da Steam com quase todas as conquistas desbloqueadas no mesmo segundo (a marca de uma ferramenta de desbloqueio), até um admin os rever.',
      'Uma conta que desligaste.',
    ],
  },
  levels: {
    heading: 'Níveis e patentes',
    text: 'O teu nível vem dos teus pontos totais: os primeiros chegam depressa, cada um seguinte custa um pouco mais e não há limite.',
    colTier: 'Patente',
    colLevels: 'Níveis',
    colFrom: 'Desde',
  },
  updates: {
    heading: 'Quando mudam os pontos',
    text: 'Os pontos são calculados antes, não quando uma página os pede:',
    points: [
      'Quando ligas uma plataforma, começa logo. Apareces nos rankings em segundos com uma estimativa (marcada com ≈), e o número exato chega à medida que os teus jogos são lidos: segundos na Steam e na PlayStation, um pouco mais numa biblioteca grande do RetroAchievements.',
      'Enquanto usas o CheevoVault, os teus pontos atualizam-se de poucas em poucas horas, lendo só os jogos que jogaste desde então.',
      'A raridade muda devagar à medida que mais pessoas jogam, por isso os teus pontos podem mexer um pouco sem fazeres nada.',
    ],
  },
  faq: [
    { q: 'Porque não somar gamerscore, troféus e pontos RA?', a: 'Porque o mesmo jogo valeria 49 na Steam e 1440 na PlayStation. Os Pontos Vault usam o que todas as plataformas têm em comum: quantos jogadores têm cada conquista.' },
    { q: 'Uma plataforma dá mais pontos do que outra?', a: 'Não: está feito para que não, e os admins verificam com dados reais que o jogo típico de cada plataforma vale o mesmo.' },
    { q: 'Posso sair dos rankings?', a: 'Sim, nas preferências (ou tornando o perfil privado). Os teus pontos continuam a ser calculados, só para ti.' },
    { q: 'Os rankings estão em beta: o que pode mudar?', a: 'Sobretudo os números finos da fórmula, se os dados reais mostrarem que uma plataforma se afasta. Se mudarem, os pontos de todos são recalculados da mesma forma.' },
  ],
}

export const ru: VaultGuideText = {
  title: 'Как работают очки Vault',
  description: 'Как CheevoVault оценивает достижения RetroAchievements, Steam и PlayStation, чтобы все платформы стоили одинаково.',
  heading: 'Как работают очки Vault',
  intro:
    'Каждая платформа считает достижения по-своему: Xbox в gamerscore, PlayStation в бронзе, серебре и золоте, RetroAchievements в очках, а Steam никак. Если их просто сложить, важнее станет платформа, а не то, как вы играете. Очки Vault измеряют каждое достижение одинаково, где бы оно ни было получено.',
  back: 'Назад к рейтингам',
  bag: {
    heading: 'Каждая игра стоит до 1000 очков',
    text: 'На любой платформе. Её достижения делят эти 1000: игра с 5000 достижений стоит не больше, чем игра с 50, она лишь делит их на мелкие части. Большая часть делится поровну; четверть следует тому, что платформа приписывает каждому (gamerscore, ранг трофея, очки RA).',
  },
  rarity: {
    heading: 'Более редкие достижения стоят больше',
    text: 'Каждое достижение сравнивается с самым частым в той же игре, поэтому неважно, считает ли платформа всех владельцев или только игравших. В десять раз реже — плюс ещё одна его стоимость, максимум в четыре раза.',
    colRarity: 'По сравнению с самым частым достижением игры',
    colMultiplier: 'Стоит',
    everyone: 'Все, кто в неё играет',
  },
  difficulty: {
    heading: 'Сложные игры стоят больше',
    text: 'Сколько из начавших игру доходят до её самого трудного достижения. Игра, которую почти все проходят за вечер, стоит меньше; трудная стоит полностью. Это касается всего, что вы получаете в этой игре.',
    colReach: 'Кто доходит до самого трудного достижения',
    colMultiplier: 'Игра стоит',
  },
  extras: {
    heading: 'Прохождение, softcore и повторяющиеся игры',
    text: 'Ещё несколько правил:',
    points: [
      'Полное прохождение (100%) добавляет пятую часть.',
      'В RetroAchievements достижения в softcore считаются наполовину, а пройти игру можно только в hardcore.',
      'Та же игра, повторённая на одной платформе (другой регион, PS4 и PS5), во второй раз считается наполовину, а дальше на одну десятую.',
    ],
  },
  example: {
    heading: 'Что это значит на практике',
    text: 'Пройденные игры с примерной редкостью. Одна и та же трудная игра оказывается близкой по очкам на любой платформе, а игра, которую любой проходит за вечер, стоит примерно треть от неё.',
    aaa: 'Одна и та же трудная игра, пройдена',
    platforms: { psn: 'PlayStation', steam: 'Steam', xbox: 'Xbox', ra: 'RetroAchievements (ретро-игра той же длины)' },
    quick: 'Платина за час',
    spam: 'Игра в Steam с 5000 достижений',
    easyNote: 'Примерные числа, чтобы показать пропорции, а не реальные игры.',
  },
  notCounted: {
    heading: 'Что не считается',
    text: 'Ваши рейтинги следуют вашему выбору:',
    points: [
      'Скрытые игры и консоли, снятые в настройках.',
      'Игры Steam, где почти все достижения открыты в одну и ту же секунду (след программы для разблокировки), пока их не проверит админ.',
      'Отвязанный аккаунт.',
    ],
  },
  levels: {
    heading: 'Уровни и ранги',
    text: 'Уровень зависит от общей суммы очков: первые приходят быстро, каждый следующий требует чуть больше, и предела нет.',
    colTier: 'Ранг',
    colLevels: 'Уровни',
    colFrom: 'От',
  },
  updates: {
    heading: 'Когда меняются очки',
    text: 'Очки считаются заранее, а не когда их запрашивает страница:',
    points: [
      'Когда вы привязываете платформу, подсчёт начинается сразу. Через несколько секунд вы появляетесь в рейтингах с оценкой (отмечена ≈), а точное число приходит по мере чтения ваших игр: секунды для Steam и PlayStation, чуть дольше для большой библиотеки RetroAchievements.',
      'Пока вы пользуетесь CheevoVault, очки обновляются каждые несколько часов, читая только игры, в которые вы играли с тех пор.',
      'Редкость меняется медленно по мере того, как играет больше людей, поэтому очки могут немного сдвинуться без ваших действий.',
    ],
  },
  faq: [
    { q: 'Почему бы просто не сложить gamerscore, трофеи и очки RA?', a: 'Потому что одна и та же игра стоила бы 49 в Steam и 1440 в PlayStation. Очки Vault используют то, что общее у всех платформ: сколько игроков имеют каждое достижение.' },
    { q: 'Даёт ли одна платформа больше очков, чем другая?', a: 'Нет: система построена так, чтобы этого не было, и админы проверяют на реальных данных, что типичная игра каждой платформы стоит одинаково.' },
    { q: 'Можно ли уйти из рейтингов?', a: 'Да, в настройках (или закрыв профиль). Ваши очки продолжают считаться, только для вас.' },
    { q: 'Рейтинги в бете: что может измениться?', a: 'В основном точные числа формулы, если реальные данные покажут, что какая-то платформа отклоняется. Тогда очки всех пересчитаются одинаково.' },
  ],
}
