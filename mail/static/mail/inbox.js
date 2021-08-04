document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('form').onsubmit = send_email;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-detail').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails =>  {
      console.log(emails);
      emails.forEach(email => show_mail(email, mailbox));
    })
}

function send_email() {

  const recipient_info = document.querySelector("#compose-recipients").value;
  const subject_info = document.querySelector("#compose-subject").value;
  const body_info = document.querySelector("#compose-body").value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipient_info,
        subject: subject_info,
        body: body_info
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
  });
  localStorage.clear();
  load_mailbox('sent')
  return false;
}

function show_mail(email, mailbox){
  const emailDiv = document.createElement('div');
  emailDiv.id = "email";
  emailDiv.className = "row justify-content-md-center";

  const recipient = document.createElement('div');
  recipient.id = "email-recipient";
  recipient.className = "card-body"
  if(mailbox === "inbox"){
    recipient.innerHTML = email.sender;
  } else {
    recipient.innerHTML = email.recipients[0];
  }
  emailDiv.append(recipient);

  const subject = document.createElement('div');
  subject.id = "email-subject";
  subject.className = "card-body";
  subject.innerHTML = email.subject;
  emailDiv.append(subject);

  const timestamp = document.createElement('div');
  timestamp.id = "email-time";
  timestamp.className = "card-body";
  timestamp.innerHTML = email.timestamp;
  emailDiv.append(timestamp);

  const emailCard = document.createElement('div');
  emailCard.id = "email-card";
  emailCard.className = "card"
  if(email.read){
    emailCard.className = "read card";
  } else{
    emailCard.className = " not-yet card";
  }
  emailCard.append(emailDiv);


  emailCard.addEventListener("click", () => view_email(email.id, mailbox));
  document.querySelector('#emails-view').append(emailCard);
  

}

function view_email(email_id, mailbox){
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-detail').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    mark_read(email_id);
    console.log(email);
    document.querySelector('#sender-email').innerHTML = email.sender;
    document.querySelector('#recipient-email').innerHTML = email.recipients;
    document.querySelector('#subject-email').innerHTML = email.subject;
    document.querySelector('#timestamp-email').innerHTML = email.timestamp;
    document.querySelector('#body-email').innerHTML = email.body;

    if(mailbox != 'sent'){
      archive = document.getElementById('archive');
      if(email.archived === true){
        archive.innerHTML = "Unarchive";
      }else {
        archive.innerHTML = "Archive";
      }
      archive.addEventListener('click', () => archive_email(email.id, email.archived));
    }
    document.getElementById('reply').addEventListener('click', () => reply_email(email));
  });
  return false;

}
function reply_email(email){
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-detail').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  document.querySelector('#compose-recipients').value = email.sender;
  if (email.subject.indexOf("Re: ") === -1){
    email.subject = "Re: " + email.subject;
  }
  document.querySelector('#compose-subject').value = email.subject;
  document.querySelector('#compose-body').value = `\nOn ${email.timestamp}, ${email.sender} wrote:\n${email.body}`;

  
}

function archive_email(email_id, state){
  const new_state = !state;
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: body = JSON.stringify({
      archived: new_state
    })
  })
  load_mailbox('inbox');
  window.location.reload();
}

function mark_read(email_id){
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: body = JSON.stringify({
      read: true
    })
  })
}