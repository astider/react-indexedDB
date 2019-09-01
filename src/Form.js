import React, { useEffect, useState } from 'react'
import { Offline, Online } from 'react-detect-offline'

// some inline styling so everything isn't squished
const formStyle = { padding: '2rem 0rem' }
const inputStyle = { margin: '1rem 0rem' }

// a simple form with a first name, last name, and submit button
const Form = ({ db }) => {
  // store form values in a state hook
  const [names, setNames] = useState({ firstname: '', lastname: '' })
  const [x, setx] = useState('no data');

  useEffect(
    () => {
      // create the store
      db.version(1).stores({ formData: 'id,value', test: '++id,firstname,lastname' })
  
      // perform a read/write transatiction on the new store
      db.open().catch(function (e) {
        console.error("Open failed: " + e.stack);
      });
      db.transaction('rw', db.formData, async () => {
        // get the first and last name from the data
        const dbFirstname = await db.formData.get('firstname')
        const dbLastname = await db.formData.get('lastname')
        console.log('mounted', dbFirstname, dbLastname);
  
        // if the first or last name fields have not be added, add them
        if (!dbFirstname) await db.formData.add({ id: 'firstname', value: '' })
        if (!dbLastname) await db.formData.add({ id: 'lastname', value: '' })
  
        // set the initial values
        setNames({
          firstname: dbFirstname ? dbFirstname.value : '',
          lastname: dbLastname ? dbLastname.value : ''
        })
      }).catch(e => {
        // log any errors
        console.log(e.stack || e)
      })
  
      // close the database connection if form is unmounted or the
      // database connection changes
      return () => db.close()
    },
    // run effect whenever the database connection changes
    [db]
  )

  // sets the name in the store and in the state hook
  const setName = id => value => {
    // update the store
    db.formData.put({ id, value })
    // update the state hook
    setNames(prevNames => ({ ...prevNames, [id]: value }))
  }

  // partial application to make on change handler easier to deal with
  const handleSetName = id => e => setName(id)(e.target.value)

  // when the form is submitted, prevent the default action
  // which reloads the page and reset the first and last name
  // in both the store and in the state hook
  const handleSubmit = async e => {
    e.preventDefault()
    try {
      await db.test.add({ firstname: names.firstname, lastname: names.lastname });
    } catch(e) {
      console.log('adding error', e)
    }
    setName('firstname')('')
    setName('lastname')('')
  }

  const getDB = async () => {
    // const fname = await db.test.toArray(); // where('firstname').startsWithIgnoreCase('')
    const fname = await db.test.where('id').above(0).toArray();
    console.log('fname', fname);
    console.log(x);
    setx({ firstname: fname.value });
  };

  useEffect(() => {
    getDB();
  }, []);

  return (
    <form style={formStyle} onSubmit={handleSubmit}>
      <span>First name:</span>
      <br />
      <input
        style={inputStyle}
        type="text"
        name="firstname"
        value={names.firstname}
        onChange={handleSetName('firstname')}
      />
      <br />
      <span>Last name:</span>
      <br />
      <input
        style={inputStyle}
        type="text"
        name="lastname"
        value={names.lastname}
        onChange={handleSetName('lastname')}
      />
      <br />
      {/* Handle whether or not the user is offline */}
      <Online>
        <input type="submit" value="Submit" />
      </Online>
      <Offline>You are currently offline!</Offline>
      {x && JSON.stringify(x)}
    </form>
  )
}

export default Form