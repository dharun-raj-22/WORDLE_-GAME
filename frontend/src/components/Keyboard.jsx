function Keyboard({ onKeyPress, keyColors }) {
  const rows = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['ENTER','Z','X','C','V','B','N','M','BACKSPACE']
  ];

  const getKeyColor = (key) => {
    const state = keyColors[key];
    if (state === 'green') return 'bg-wordle-green';
    if (state === 'yellow') return 'bg-wordle-yellow';
    if (state === 'gray') return 'bg-wordle-gray';
    return 'bg-[#818384]';
  };

  return (
    <div className="w-full flex flex-col gap-2 max-w-[500px]">
      {rows.map((row, i) => (
        <div key={i} className="flex justify-center gap-1.5 w-full">
          {row.map(key => (
            <button
              key={key}
              onClick={() => onKeyPress(key)}
              className={`
                ${key === 'ENTER' || key === 'BACKSPACE' ? 'flex-[1.5] text-[10px] sm:text-xs' : 'flex-1 text-xs sm:text-sm'}
                h-[44px] sm:h-[58px] rounded font-bold uppercase active:scale-95 transition-transform
                flex items-center justify-center select-none
                ${getKeyColor(key)}
              `}
            >
              {key === 'BACKSPACE' ? '⌫' : key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export default Keyboard;
