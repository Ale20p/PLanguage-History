INSERT INTO paradigms (name) VALUES
    ('Procedural'),
    ('Object-Oriented'),
    ('Functional'),
    ('Imperative'),
    ('Multi-Paradigm'),
    ('Scripting'),
    ('Systems'),
    ('Logic'),
    ('Concurrent'),
    ('Generic');

INSERT INTO creators (name) VALUES
    ('Dennis Ritchie'),
    ('Bjarne Stroustrup'),
    ('Guido van Rossum'),
    ('Brendan Eich'),
    ('James Gosling'),
    ('Yukihiro Matsumoto'),
    ('John McCarthy'),
    ('Sun Microsystems'),
    ('Oracle'),
    ('Mozilla'),
    ('Bell Labs'),
    ('Microsoft');

INSERT INTO languages (id, name, release_date, website, code_snippet, description) VALUES
('c', 'C', '1972-01-01', 'https://en.cppreference.com/w/c',
'#include <stdio.h>

int main() {
    printf("Hello, World!\n");
    return 0;
}',
'C is a general-purpose programming language created at Bell Labs. It has been one of the most influential languages in computing history, forming the foundation for operating systems like Unix and Linux. Its direct access to memory via pointers and its minimal runtime make it the go-to language for systems programming, embedded systems, and performance-critical applications.');

INSERT INTO languages (id, name, release_date, website, code_snippet, description) VALUES
('cpp', 'C++', '1985-01-01', 'https://isocpp.org/',
'#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}',
'C++ was designed by Bjarne Stroustrup as an extension of C, adding object-oriented features, generic programming via templates, and later, modern abstractions like lambdas and smart pointers. It remains the dominant language for game engines, high-frequency trading systems, and browser engines.');

INSERT INTO languages (id, name, release_date, website, code_snippet, description) VALUES
('python', 'Python', '1991-02-20', 'https://www.python.org/',
'print("Hello, World!")',
'Python is a high-level, dynamically typed language created by Guido van Rossum. Its emphasis on readability and simplicity has made it the most popular language for data science, machine learning, web development, and scripting. Python was influenced by C, ABC, and Modula-3.');

INSERT INTO languages (id, name, release_date, website, code_snippet, description) VALUES
('javascript', 'JavaScript', '1995-12-04', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
'console.log("Hello, World!");',
'JavaScript was created by Brendan Eich at Netscape in just 10 days. Originally a simple browser scripting language, it has evolved into the backbone of the modern web. With Node.js, it also powers server-side applications. JavaScript was influenced by Java, Scheme, and Self.');

INSERT INTO languages (id, name, release_date, website, code_snippet, description) VALUES
('java', 'Java', '1995-05-23', 'https://www.java.com/',
'public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}',
'Java was developed by James Gosling at Sun Microsystems with the principle of "Write Once, Run Anywhere" via the Java Virtual Machine (JVM). It became the dominant enterprise language and powers Android applications, large-scale backend systems, and big data platforms.');

INSERT INTO languages (id, name, release_date, website, code_snippet, description) VALUES
('ruby', 'Ruby', '1995-12-21', 'https://www.ruby-lang.org/',
'puts "Hello, World!"',
'Ruby was created by Yukihiro "Matz" Matsumoto with the goal of making programming enjoyable. Its elegant syntax and the Ruby on Rails framework revolutionized web development in the mid-2000s. Ruby blends object-oriented and functional paradigms, drawing influence from Perl, Smalltalk, and Lisp.');

INSERT INTO languages (id, name, release_date, website, code_snippet, description) VALUES
('lisp', 'Lisp', '1958-01-01', 'https://lisp-lang.org/',
'(print "Hello, World!")',
'Lisp is the second-oldest high-level programming language, created by John McCarthy. It pioneered many foundational computer science concepts including tree data structures, automatic storage management (garbage collection), and the concept of code as data (homoiconicity). Lisp has influenced virtually every functional programming language that followed.');

INSERT INTO language_paradigm (language_id, paradigm_id) VALUES
    ('c',          (SELECT id FROM paradigms WHERE name = 'Procedural')),
    ('c',          (SELECT id FROM paradigms WHERE name = 'Imperative')),
    ('c',          (SELECT id FROM paradigms WHERE name = 'Systems')),
    ('cpp',        (SELECT id FROM paradigms WHERE name = 'Object-Oriented')),
    ('cpp',        (SELECT id FROM paradigms WHERE name = 'Generic')),
    ('cpp',        (SELECT id FROM paradigms WHERE name = 'Multi-Paradigm')),
    ('cpp',        (SELECT id FROM paradigms WHERE name = 'Systems')),
    ('python',     (SELECT id FROM paradigms WHERE name = 'Object-Oriented')),
    ('python',     (SELECT id FROM paradigms WHERE name = 'Functional')),
    ('python',     (SELECT id FROM paradigms WHERE name = 'Multi-Paradigm')),
    ('python',     (SELECT id FROM paradigms WHERE name = 'Scripting')),
    ('javascript', (SELECT id FROM paradigms WHERE name = 'Object-Oriented')),
    ('javascript', (SELECT id FROM paradigms WHERE name = 'Functional')),
    ('javascript', (SELECT id FROM paradigms WHERE name = 'Multi-Paradigm')),
    ('javascript', (SELECT id FROM paradigms WHERE name = 'Scripting')),
    ('java',       (SELECT id FROM paradigms WHERE name = 'Object-Oriented')),
    ('java',       (SELECT id FROM paradigms WHERE name = 'Imperative')),
    ('java',       (SELECT id FROM paradigms WHERE name = 'Multi-Paradigm')),
    ('ruby',       (SELECT id FROM paradigms WHERE name = 'Object-Oriented')),
    ('ruby',       (SELECT id FROM paradigms WHERE name = 'Functional')),
    ('ruby',       (SELECT id FROM paradigms WHERE name = 'Multi-Paradigm')),
    ('ruby',       (SELECT id FROM paradigms WHERE name = 'Scripting')),
    ('lisp',       (SELECT id FROM paradigms WHERE name = 'Functional')),
    ('lisp',       (SELECT id FROM paradigms WHERE name = 'Multi-Paradigm'));

INSERT INTO language_creator (language_id, creator_id) VALUES
    ('c',          (SELECT id FROM creators WHERE name = 'Dennis Ritchie')),
    ('c',          (SELECT id FROM creators WHERE name = 'Bell Labs')),
    ('cpp',        (SELECT id FROM creators WHERE name = 'Bjarne Stroustrup')),
    ('python',     (SELECT id FROM creators WHERE name = 'Guido van Rossum')),
    ('javascript', (SELECT id FROM creators WHERE name = 'Brendan Eich')),
    ('javascript', (SELECT id FROM creators WHERE name = 'Mozilla')),
    ('java',       (SELECT id FROM creators WHERE name = 'James Gosling')),
    ('java',       (SELECT id FROM creators WHERE name = 'Sun Microsystems')),
    ('ruby',       (SELECT id FROM creators WHERE name = 'Yukihiro Matsumoto')),
    ('lisp',       (SELECT id FROM creators WHERE name = 'John McCarthy'));

INSERT INTO connections (source_id, target_id, connection_type) VALUES
    ('c', 'cpp', 'FORKED_FROM'),
    ('c', 'python', 'INFLUENCED_BY'),
    ('java', 'javascript', 'INFLUENCED_BY'),
    ('lisp', 'javascript', 'INFLUENCED_BY'),
    ('cpp', 'java', 'INFLUENCED_BY'),
    ('lisp', 'ruby', 'INFLUENCED_BY'),
    ('python', 'ruby', 'INFLUENCED_BY'),
    ('c', 'java', 'INFLUENCED_BY');
