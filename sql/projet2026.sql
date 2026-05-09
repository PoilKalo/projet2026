create database if not exists projet2026
character set utf8mb4
collate utf8mb4_general_ci;

use projet2026;

create table site(

    idSite int auto_increment primary key,
    nom varchar(100) not null,
    adresse varchar(150),
    code_postal VARCHAR(10),
    localite varchar(100),
    photo varchar(255)
)engine = innodb;

create table local(

    idLocal int auto_increment primary key,
    nom varchar(100) not null,
    infoLocal text,
    idSite int not null,
    photo varchar(255),
    foreign key (idSite) references site(idSite)
    on delete cascade
    on update cascade
)engine  = innodb;

create table rangement(

    idRangement int auto_increment primary key,
    nom varchar(100) not null,
    infoRangement text,
    idLocal int not null,
    photo varchar(255),

    foreign key (idLocal) references local(idLocal)
    on delete cascade
    on update cascade
)engine = innodb;

create table niveau(
    idNiveau int auto_increment primary key,
    nom varchar(100) not null,
    infoNiveau text,
    idRangement int not null,
    photo varchar(255),

    foreign key (idRangement) references rangement(idRangement)
    on delete cascade
    on update cascade
)engine = innodb;

create table categorie(

    idCategorie int auto_increment primary key,
    nom varchar(100) not null,
    infoPlus text
)engine = innodb;

create table utilisateur(

    idUtilisateur int auto_increment primary key,
    nomUtilisateur varchar(100) not null,
    prenomUtilisateur varchar(100) not null,
    role ENUM('admin', 'owner', 'user') not null default 'user',
    login varchar(100) not null unique,
    mdp varchar(255) not null
)engine = innodb;

create table objet(

    idObjet int auto_increment primary key,
    nom varchar(100) not null,
    infoRangement text,
    photo varchar(255),
    idCategorie int not null,
    idNiveau int not null,
    infoPlus text,
    dateAjout date default (current_date),
    idUtilisateur int not null,
    statut varchar(50) default 'disponible',

    foreign key (idCategorie) references categorie(idCategorie)
    on delete restrict
    on update cascade,

    foreign key (idNiveau) references niveau(idNiveau)
    on delete restrict
    on update cascade,

    foreign key (idUtilisateur) references utilisateur(idUtilisateur)
    on delete restrict
    on update cascade
)engine = innodb;

create table pret(
    idPret int auto_increment primary key,
    idObjet int not null,
    idUtilisateur int not null,
    datePret date not null default (current_date),
    dateRetourPrevue date,
    dateRetourReelle date,
    commentaire text,

    foreign key (idObjet) references objet(idObjet)
    on delete cascade
    on update cascade,

    foreign key (idUtilisateur) references utilisateur(idUtilisateur)
    on delete cascade
    on update cascade
)engine = innodb;

insert into utilisateur
(nomUtilisateur, prenomUtilisateur, role, login, mdp)
values
('Admin','Principal','admin','admin','admin'),
('Dupont','Jean','owner','jean','jean'),
('Martin','Lucas','user','lucas','lucas');

insert into site
(nom, adresse, code_postal, localite, photo)
values
('Maison','rue exemple 10','7000','Mons',null);

insert into local
(nom, infoLocal, idSite, photo)
values
('Salon','Pièce principale',1,null);

insert into rangement
(nom, infoRangement, idLocal, photo)
values
('Bibliothèque','Grande bibliothèque du salon',1,null);

insert into niveau
(nom, infoNiveau, idRangement, photo)
values
('Etagère 1','Premier niveau',1,null);

insert into categorie
(nom, infoPlus)
values
('Livre','Livres et romans'),
('BD','Bandes dessinées'),
('Jeu','Jeux de société');

insert into objet
(nom, infoRangement, photo, idCategorie, idNiveau, infoPlus, idUtilisateur, statut)
values
('Tintin au Tibet',"Rangé à gauche de l'étagère",null,2,1,'BD en bon état',2,'disponible'),
('Monopoly','Boîte bleue',null,3,1,'Jeu complet',2,'disponible');