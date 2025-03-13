import Snowfall from 'react-snowfall'
import "../styles/RounoHome.css"

function RounoHome () {
    return (
        <section className='bg-rounohome'>
            <Snowfall snowflakeCount={30} radius={[0.5,0.5]}/>
            <button className='rounoGame'>PORTE</button>
        </section>
    )
}

export default RounoHome