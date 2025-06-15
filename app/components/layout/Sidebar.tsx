import { NavLink } from 'react-router'
import { useUser } from '~/utils/xumm'
import { Search } from './Search'

export const SideDrawerButton = () => {
  return (
    <label
      htmlFor='side-drawer'
      aria-label='open sidebar'
      className='hidden sm:block lg:hidden btn btn-ghost btn-square'
    >
      {/* <input type='checkbox' id='side-drawer' className='drawer-toggle' /> */}
      <svg
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 24 24'
        className='inline-block h-9 w-9 stroke-current'
      >
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 6h16M4 12h16M4 18h16' />
        <title>hamburger</title>
      </svg>
    </label>
  )
}

export const Sidebar = () => {
  const { xumm, user } = useUser()
  return (
    <>
      <input id='side-drawer' type='checkbox' className='drawer-toggle' />

      <aside className='drawer-side z-10'>
        <label htmlFor='side-drawer' aria-label='close sidebar' className='drawer-overlay' />

        <ul className='menu overflow-auto bg-neutral p-2 w-50 h-full text-accent'>
          <Search />
          <div className='divider' />

          <li>
            <NavLink to='/' className='current-page'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                height='32px'
                viewBox='0 -960 960 960'
                width='32px'
                fill='currentColor'
              >
                <path d='M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z' />
                <title>home</title>
              </svg>
              ホーム
            </NavLink>
          </li>

          <li>
            <NavLink to='/chart' className='current-page'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                height='32'
                viewBox='0 -960 960 960'
                width='32'
                fill='currentColor'
              >
                <path d='M320-414v-306h120v306l-60-56-60 56Zm200 60v-526h120v406L520-354ZM120-216v-344h120v224L120-216Zm0 98 258-258 142 122 224-224h-64v-80h200v200h-80v-64L524-146 382-268 232-118H120Z' />
              </svg>
              チャート
            </NavLink>
          </li>

          <li>
            <NavLink to='/test' className='current-page'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                height='32'
                viewBox='0 -960 960 960'
                width='32'
                fill='currentColor'
              >
                <path d='M120-200v-120h120v120H120Zm240 0v-120h120v120H360Zm240 0v-120h120v120H600ZM120-400v-120h120v120H120Zm240 0v-120h120v120H360Zm240 0v-120h120v120H600ZM120-600v-120h120v120H120Zm240 0v-120h120v120H360Zm240 0v-120h120v120H600Z' />
              </svg>
              テスト
            </NavLink>
          </li>

          <li>
            <button
              onClick={async () => {
                user ? await xumm?.logout() : await xumm?.authorize()
              }}
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                height='32px'
                viewBox='0 -960 960 960'
                width='32px'
                fill='currentColor'
              >
                <path d='M480-120v-80h280v-560H480v-80h280q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H480Zm-80-160-55-58 102-102H120v-80h327L345-622l55-58 200 200-200 200Z' />
                <title>login</title>
              </svg>
              {user ? 'ログアウト' : 'ログイン'}
            </button>
          </li>

          <li>
            <NavLink to='/dashboard' className='current-page'>
              <svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' />
              </svg>
              ダッシュボード
            </NavLink>
          </li>

          <li>
            <NavLink to='/portfolio' className='current-page'>
              <svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z' />
              </svg>
              ポートフォリオ
            </NavLink>
          </li>

          <li>
            <NavLink to='/alerts' className='current-page'>
              <svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z' />
              </svg>
              アラート
            </NavLink>
          </li>

          <div className='divider' />

          <li>
            <NavLink to='https://xrpl.org/ja/docs' target='_blank' rel='noopener noreferrer'>
              <svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.11 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z' />
              </svg>
              XRPL Docs
            </NavLink>
          </li>

          <li>
            <NavLink to='https://livenet.xrpl.org/' target='_blank' rel='noopener noreferrer'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                height='32px'
                viewBox='0 -960 960 960'
                width='32px'
                fill='currentColor'
              >
                <path d='M440-183v-274L200-596v274l240 139Zm80 0 240-139v-274L520-457v274Zm-40-343 237-137-237-137-237 137 237 137ZM160-252q-19-11-29.5-29T120-321v-318q0-22 10.5-40t29.5-29l280-161q19-11 40-11t40 11l280 161q19 11 29.5 29t10.5 40v318q0 22-10.5 40T800-252L520-91q-19 11-40 11t-40-11L160-252Zm320-228Z' />
              </svg>
              エクスプローラー
            </NavLink>
          </li>

          <li>
            <NavLink to='https://bithomp.com/ja' target='_blank' rel='noopener noreferrer'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                height='32px'
                viewBox='0 -960 960 960'
                width='32px'
                fill='currentColor'
              >
                <path d='M440-280h80v-160h160v-80H520v-160h-80v160H280v80h160v160Zm40 200q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z' />
              </svg>
              Bithomp
            </NavLink>
          </li>

          <li>
            <NavLink to='https://apps.xaman.dev/' target='_blank' rel='noopener noreferrer'>
              <svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z' />
              </svg>
              DevConsole
            </NavLink>
          </li>

          <div className='divider' />

          <li>
            <a
              href='https://app.akindo.io/hackathons/27WABBdmRUvvOr1m?tab=products'
              target='_blank'
              rel='noopener noreferrer'
            >
              <svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z' />
              </svg>
              プロダクト
            </a>
          </li>

          <li>
            <NavLink to='https://youtu.be/dQw4w9WgXcQ' target='_blank' rel='noopener noreferrer'>
              <svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z'></path>
              </svg>
              Youtube
            </NavLink>
          </li>

          <li>
            <a href='https://x.com/' target='_blank' rel='noopener noreferrer'>
              <svg
                width='32'
                height='32'
                viewBox='0 0 1200 1227'
                fill='currentColor'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path d='M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z' />
              </svg>
              X.com
            </a>
          </li>

          <li>
            <a href='https://github.com/' target='_blank' rel='noopener noreferrer'>
              <svg
                width='32'
                height='32'
                viewBox='0 0 256 250'
                version='1.1'
                xmlns='http://www.w3.org/2000/svg'
                fill='currentColor'
              >
                <path d='M128.00106,0 C57.3172926,0 0,57.3066942 0,128.00106 C0,184.555281 36.6761997,232.535542 87.534937,249.460899 C93.9320223,250.645779 96.280588,246.684165 96.280588,243.303333 C96.280588,240.251045 96.1618878,230.167899 96.106777,219.472176 C60.4967585,227.215235 52.9826207,204.369712 52.9826207,204.369712 C47.1599584,189.574598 38.770408,185.640538 38.770408,185.640538 C27.1568785,177.696113 39.6458206,177.859325 39.6458206,177.859325 C52.4993419,178.762293 59.267365,191.04987 59.267365,191.04987 C70.6837675,210.618423 89.2115753,204.961093 96.5158685,201.690482 C97.6647155,193.417512 100.981959,187.77078 104.642583,184.574357 C76.211799,181.33766 46.324819,170.362144 46.324819,121.315702 C46.324819,107.340889 51.3250588,95.9223682 59.5132437,86.9583937 C58.1842268,83.7344152 53.8029229,70.715562 60.7532354,53.0843636 C60.7532354,53.0843636 71.5019501,49.6441813 95.9626412,66.2049595 C106.172967,63.368876 117.123047,61.9465949 128.00106,61.8978432 C138.879073,61.9465949 149.837632,63.368876 160.067033,66.2049595 C184.49805,49.6441813 195.231926,53.0843636 195.231926,53.0843636 C202.199197,70.715562 197.815773,83.7344152 196.486756,86.9583937 C204.694018,95.9223682 209.660343,107.340889 209.660343,121.315702 C209.660343,170.478725 179.716133,181.303747 151.213281,184.472614 C155.80443,188.444828 159.895342,196.234518 159.895342,208.176593 C159.895342,225.303317 159.746968,239.087361 159.746968,243.303333 C159.746968,246.709601 162.05102,250.70089 168.53925,249.443941 C219.370432,232.499507 256,184.536204 256,128.00106 C256,57.3066942 198.691187,0 128.00106,0 Z M47.9405593,182.340212 C47.6586465,182.976105 46.6581745,183.166873 45.7467277,182.730227 C44.8183235,182.312656 44.2968914,181.445722 44.5978808,180.80771 C44.8734344,180.152739 45.876026,179.97045 46.8023103,180.409216 C47.7328342,180.826786 48.2627451,181.702199 47.9405593,182.340212 Z M54.2367892,187.958254 C53.6263318,188.524199 52.4329723,188.261363 51.6232682,187.366874 C50.7860088,186.474504 50.6291553,185.281144 51.2480912,184.70672 C51.8776254,184.140775 53.0349512,184.405731 53.8743302,185.298101 C54.7115892,186.201069 54.8748019,187.38595 54.2367892,187.958254 Z M58.5562413,195.146347 C57.7719732,195.691096 56.4895886,195.180261 55.6968417,194.042013 C54.9125733,192.903764 54.9125733,191.538713 55.713799,190.991845 C56.5086651,190.444977 57.7719732,190.936735 58.5753181,192.066505 C59.3574669,193.22383 59.3574669,194.58888 58.5562413,195.146347 Z M65.8613592,203.471174 C65.1597571,204.244846 63.6654083,204.03712 62.5716717,202.981538 C61.4524999,201.94927 61.1409122,200.484596 61.8446341,199.710926 C62.5547146,198.935137 64.0575422,199.15346 65.1597571,200.200564 C66.2704506,201.230712 66.6095936,202.705984 65.8613592,203.471174 Z M75.3025151,206.281542 C74.9930474,207.284134 73.553809,207.739857 72.1039724,207.313809 C70.6562556,206.875043 69.7087748,205.700761 70.0012857,204.687571 C70.302275,203.678621 71.7478721,203.20382 73.2083069,203.659543 C74.6539041,204.09619 75.6035048,205.261994 75.3025151,206.281542 Z M86.046947,207.473627 C86.0829806,208.529209 84.8535871,209.404622 83.3316829,209.4237 C81.8013,209.457614 80.563428,208.603398 80.5464708,207.564772 C80.5464708,206.498591 81.7483088,205.631657 83.2786917,205.606221 C84.8005962,205.576546 86.046947,206.424403 86.046947,207.473627 Z M96.6021471,207.069023 C96.7844366,208.099171 95.7267341,209.156872 94.215428,209.438785 C92.7295577,209.710099 91.3539086,209.074206 91.1652603,208.052538 C90.9808515,206.996955 92.0576306,205.939253 93.5413813,205.66582 C95.054807,205.402984 96.4092596,206.021919 96.6021471,207.069023 Z'></path>
              </svg>
              Github
            </a>
          </li>

          <div className='divider' />
        </ul>
      </aside>
    </>
  )
}
