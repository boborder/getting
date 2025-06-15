export const Loading = () => {
  return (
    <>
      <progress className='my-0.5' />
      <div className='fixed inset-0 flex items-center justify-center z-10'>
        <div className='p-8 rounded-box bg-base-200/40'>
          <div className='text-xl animate-pulse'>読み込み中...</div>
          <div className='flex items-center justify-center'>
            {Array.from({ length: 5 }).map(() => (
              <span key={Math.random()} className='loading loading-infinity loading-xl' />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
