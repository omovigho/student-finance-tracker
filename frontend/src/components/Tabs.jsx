import clsx from 'clsx';

const Tabs = ({ tabs, activeValue, onChange }) => {
	return (
		<div role="tablist" aria-orientation="horizontal" className="flex flex-wrap gap-2 rounded-xl bg-slate-100 p-1">
			{tabs.map((tab) => {
				const isActive = tab.value === activeValue;
				return (
					<button
						key={tab.value}
						type="button"
						role="tab"
						aria-selected={isActive}
						onClick={() => onChange?.(tab.value)}
						className={clsx(
							'rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
							isActive ? 'bg-white text-primary shadow-sm' : 'text-muted hover:text-primary'
						)}
					>
						{tab.label}
					</button>
				);
			})}
		</div>
	);
};

export default Tabs;
