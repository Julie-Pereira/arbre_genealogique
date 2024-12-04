import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://uwqimphpkzcjinlucwwl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cWltcGhwa3pjamlubHVjd3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxMzA1ODcsImV4cCI6MjA0ODcwNjU4N30.IA-ZS1tu3FuUdrTioALpWuiJvgkkZRn4qX_ghcW4tXI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Charger l'arbre généalogique initialement
window.onload = async function () {
    await loadTree();
};

// Charger et afficher l'arbre généalogique
async function loadTree() {
    try {
        const { data, error } = await supabase
            .from('members')
            .select('*');

        if (error) {
            console.error("Erreur lors du chargement des membres :", error);
        } else {
            console.log("Membres chargés :", data); // Affiche les membres pour inspection
            renderTree(data); // Appelle la fonction pour afficher l'arbre
        }
    } catch (error) {
        console.error("Erreur lors du chargement de l'arbre :", error);
    }
}

// Afficher l'arbre généalogique
function renderTree(members) {
    const treeContainer = document.getElementById('tree-container');
    treeContainer.innerHTML = ''; // Réinitialiser le contenu avant de le remplir

    // Créer une map des membres pour les organiser en structure parent-enfant
    const memberMap = members.reduce((acc, member) => {
        acc[member.id] = { ...member, children: [] };
        return acc;
    }, {});

    // Organiser les membres en enfants de leurs parents
    members.forEach(member => {
        if (member.parent_id) {
            if (memberMap[member.parent_id]) {
                memberMap[member.parent_id].children.push(memberMap[member.id]); // Relie l'enfant au parent
            } else {
                console.warn(`Parent ID ${member.parent_id} manquant pour ${member.prenom} ${member.nom}`);
            }
        }
    });

    console.log("Membres organisés avec relations parent-enfant :", memberMap);

    // Afficher tous les nœuds en partant des racines
    members.forEach(member => {
        if (!member.parent_id || !memberMap[member.parent_id]) {
            renderNode(memberMap[member.id], treeContainer);
        }
    });
}

// Afficher un nœud et ses enfants
function renderNode(member, container) {
    const node = document.createElement('div');
    node.className = 'tree-node';
    node.setAttribute('data-id', member.id);

    node.innerHTML = `
        <div class="node">
            <strong>${member.prenom} ${member.nom}</strong><br>
            Sexe: ${member.sexe}<br>
            Date de naissance: ${member.dob}<br>
            <button class="delete" data-member-id="${member.id}">Supprimer</button>
        </div>
        <div class="links">
            ${member.parent_id ? `<button class="parent-link" data-parent-id="${member.parent_id}">Voir les parents</button>` : ''}
            ${member.children.length > 0 ? `<button class="children-link" data-member-id="${member.id}">Voir les enfants</button>` : ''}
        </div>
    `;

    container.appendChild(node);

    // Si le membre a des enfants, les afficher
    if (member.children.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'children-container';

        member.children.forEach(child => {
            renderNode(child, childrenContainer); // Appel récursif pour chaque enfant
        });

        container.appendChild(childrenContainer);
    }

    // Attacher l'événement pour supprimer un membre
    const deleteButton = node.querySelector('.delete');
    if (deleteButton) {
        deleteButton.addEventListener('click', function () {
            if (confirm(`Voulez-vous vraiment supprimer ${member.prenom} ${member.nom} ?`)) {
                deletePerson(member.id);
            }
        });
    }

    // Afficher les parents ou enfants
    const parentButton = node.querySelector('.parent-link');
    if (parentButton) {
        parentButton.addEventListener('click', function () {
            alert(`Le parent de ${member.prenom} ${member.nom} est l'ID ${member.parent_id}`);
        });
    }

    const childrenButton = node.querySelector('.children-link');
    if (childrenButton) {
        childrenButton.addEventListener('click', function () {
            alert(`Les enfants de ${member.prenom} ${member.nom} sont : ${member.children.map(child => child.prenom).join(', ')}`);
        });
    }
}

// Supprimer un membre
async function deletePerson(memberId) {
    try {
        const { error } = await supabase
            .from('members')
            .delete()
            .eq('id', memberId);

        if (error) {
            alert("Erreur lors de la suppression : " + error.message);
        } else {
            alert("Membre supprimé avec succès !");
            await loadTree(); // Recharge l’arbre après suppression
        }
    } catch (error) {
        console.error("Erreur lors de la suppression :", error);
    }
}

// Ajouter un nouveau membre
document.getElementById('addPersonForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const gender = document.getElementById('gender').value;
    const dob = document.getElementById('dob').value;
    const parentId = document.getElementById('parent-id').value || null;

    try {
        if (parentId) {
            const { data: parentData, error: parentError } = await supabase
                .from('members')
                .select('*')
                .eq('id', parentId)
                .single();

            if (parentError || !parentData) {
                alert("Le parent spécifié n'existe pas !");
                return;
            }
        }

        const { data, error } = await supabase
            .from('members')
            .insert([
                {
                    nom: lastName,
                    prenom: firstName,
                    sexe: gender,
                    dob: dob,
                    parent_id: parentId ? parseInt(parentId) : null
                }
            ]);

        if (error) {
            alert("Erreur lors de l'ajout : " + error.message);
        } else {
            alert("Personne ajoutée avec succès !");
            await loadTree(); // Recharge l’arbre après ajout
        }
    } catch (error) {
        console.error("Erreur lors de l'ajout :", error);
    }
});

// Afficher le formulaire d'ajout
document.getElementById('addPersonButton').addEventListener('click', function () {
    document.getElementById('form-container').style.display = 'block';
});
