import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function FirestoreDemo() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");

  // Fetch users from Firestore
  useEffect(() => {
    async function fetchUsers() {
      const querySnapshot = await getDocs(collection(db, "users"));
      setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    fetchUsers();
  }, []);

  // Add a new user
  async function handleAddUser(e) {
    e.preventDefault();
    if (!name) return;
    await addDoc(collection(db, "users"), { name });
    setName("");
    // Refresh users
    const querySnapshot = await getDocs(collection(db, "users"));
    setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }

  return (
    <div>
      <h2>Firestore Users Demo</h2>
      <form onSubmit={handleAddUser}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
        <button type="submit">Add User</button>
      </form>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
